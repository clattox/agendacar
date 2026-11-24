// routes/flota/portalConductor.js
// API exclusiva para conductores autenticados (rol=conductor)
// Acceso: solo el conductor ve su propio vehículo
const router = require('express').Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// ——— helper: enriquece documentos con días restantes ————————
function enriquecerDocumentos(vehiculo) {
  const hoy = new Date()
  return {
    ...vehiculo,
    documentos: (vehiculo.documentos || []).map(doc => {
      const dias = Math.ceil((new Date(doc.fechaVencimiento) - hoy) / (1000 * 60 * 60 * 24))
      return {
        ...doc,
        diasRestantes: dias,
        alerta: dias < 0 ? 'VENCIDO' : dias <= 15 ? 'CRITICO' : 'VIGENTE',
      }
    }),
  }
}

// ——— GET /api/flota/portal/mi-vehiculo ————————————————————
// Retorna todos los vehículos asignados al conductor autenticado.
// Si tiene uno solo → { conductor, vehiculo, vehiculos: [v] }
// Si tiene más de uno → { conductor, vehiculo: null, vehiculos: [v1, v2, …] }
// El frontend selecciona el vehículo activo y lo pide por id.
router.get('/mi-vehiculo', async (req, res) => {
  try {
    const { id: usuarioId, tenantId } = req.user

    const conductor = await prisma.conductor.findFirst({
      where: { usuarioId, tenantId },
    })
    if (!conductor) {
      return res.status(404).json({ error: 'No tienes un perfil de conductor asignado' })
    }

    const vehiculos = await prisma.flotaVehiculo.findMany({
      where: { conductorId: conductor.id, tenantId },
      include: {
        documentos: {
          where: { activo: true },
          orderBy: { fechaVencimiento: 'asc' },
        },
      },
      orderBy: { patente: 'asc' },
    })

    if (vehiculos.length === 0) {
      return res.json({ conductor, vehiculo: null, vehiculos: [] })
    }

    const vehiculosEnriquecidos = vehiculos.map(enriquecerDocumentos)

    // Un solo vehículo → lo entregamos directamente (retrocompatible)
    if (vehiculosEnriquecidos.length === 1) {
      return res.json({ conductor, vehiculo: vehiculosEnriquecidos[0], vehiculos: vehiculosEnriquecidos })
    }

    // Múltiples → vehiculo=null, el frontend muestra selector
    res.json({ conductor, vehiculo: null, vehiculos: vehiculosEnriquecidos })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener datos del conductor' })
  }
})

// ——— POST /api/flota/portal/actividad ————————————————————
// El conductor registra una actividad en su vehículo
router.post('/actividad', async (req, res) => {
  try {
    const { id: usuarioId, tenantId } = req.user

    const conductor = await prisma.conductor.findFirst({
      where: { usuarioId, tenantId },
    })
    if (!conductor) return res.status(403).json({ error: 'Sin perfil de conductor' })

    const {
      tipo, fecha, notas, vehiculoId,
      // KILOMETRAJE
      odometroActual,
      // COMBUSTIBLE
      tipoCombustible, litros, monto, estacion,
      // PEAJE
      autopista, sentido,
      // TRASLADO
      destino, motivo, kmSalida, kmLlegada,
      // MANTENCION
      tipoMantencion, taller, costo, numeroFolio, proxFecha, proxKm,
    } = req.body

    // Si el conductor tiene múltiples vehículos, el frontend envía vehiculoId
    let vehiculo
    if (vehiculoId) {
      vehiculo = await prisma.flotaVehiculo.findFirst({
        where: { id: vehiculoId, conductorId: conductor.id, tenantId },
      })
    } else {
      vehiculo = await prisma.flotaVehiculo.findFirst({
        where: { conductorId: conductor.id, tenantId },
      })
    }
    if (!vehiculo) return res.status(404).json({ error: 'No tienes vehículo asignado' })

    if (!tipo || !fecha) {
      return res.status(400).json({ error: 'tipo y fecha son obligatorios' })
    }

    // Crear actividad base
    const actividad = await prisma.flotaActividad.create({
      data: {
        tenantId,
        vehiculoId:      vehiculo.id,
        tipo,
        fecha:           new Date(fecha),
        registradoPorId: conductor.id,
        notas:           notas || null,
      },
    })

    // Sub-registro según tipo
    if (tipo === 'KILOMETRAJE' && odometroActual) {
      const esMasReciente = odometroActual > vehiculo.odometroActual
      const kmRecorridos = esMasReciente ? odometroActual - vehiculo.odometroActual : null
      await prisma.kmRegistro.create({
        data: { actividadId: actividad.id, odometroActual, kmRecorridos },
      })
      // Solo actualizar el odómetro "actual" del vehículo si el valor ingresado
      // es mayor al que ya tenía — evita que un registro histórico (backfill de
      // una fecha anterior, con km menor) retroceda el odómetro del vehículo.
      if (esMasReciente) {
        await prisma.flotaVehiculo.update({
          where: { id: vehiculo.id },
          data:  { odometroActual },
        })
      }
    }

    if (tipo === 'COMBUSTIBLE' && tipoCombustible && litros && monto) {
      await prisma.combustibleRegistro.create({
        data: {
          actividadId:    actividad.id,
          tipoCombustible,
          litros,
          monto,
          estacion:       estacion || null,
          odometroAlCargar: odometroActual || null,
        },
      })
    }

    if (tipo === 'PEAJE' && monto) {
      await prisma.peajeRegistro.create({
        data: {
          actividadId: actividad.id,
          monto,
          autopista:   autopista || null,
          sentido:     sentido || 'IDA',
        },
      })
    }

    if (tipo === 'TRASLADO') {
      if (!destino) return res.status(400).json({ error: 'destino es obligatorio para TRASLADO' })
      await prisma.trasladoRegistro.create({
        data: {
          actividadId: actividad.id,
          destino,
          motivo:      motivo    || null,
          kmSalida:    kmSalida  ? Number(kmSalida)  : null,
          kmLlegada:   kmLlegada ? Number(kmLlegada) : null,
          fechaSalida: new Date(),
        },
      })
      // Actualizar odómetro si kmLlegada es mayor al actual
      if (kmLlegada && Number(kmLlegada) > vehiculo.odometroActual) {
        await prisma.flotaVehiculo.update({
          where: { id: vehiculo.id },
          data:  { odometroActual: Number(kmLlegada) },
        })
      }
    }

    if (tipo === 'MANTENCION') {
      if (!tipoMantencion) return res.status(400).json({ error: 'tipoMantencion es obligatorio' })
      await prisma.mantencionRegistro.create({
        data: {
          actividadId:  actividad.id,
          tipo:         tipoMantencion,
          taller:       taller      || null,
          costo:        costo       ? Number(costo)  : null,
          numeroFolio:  numeroFolio || null,
          proxFecha:    proxFecha   ? new Date(proxFecha) : null,
          proxKm:       proxKm      ? Number(proxKm) : null,
        },
      })
    }

    res.status(201).json({ message: 'Actividad registrada', actividadId: actividad.id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al registrar actividad' })
  }
})

// ——— GET /api/flota/portal/actividades-recientes ————————————
// Últimas 15 actividades del vehículo del conductor (para mostrar traslados en curso)
router.get('/actividades-recientes', async (req, res) => {
  try {
    const { id: usuarioId, tenantId } = req.user
    const vehiculoId = req.query.vehiculoId ? Number(req.query.vehiculoId) : null

    const conductor = await prisma.conductor.findFirst({
      where: { usuarioId, tenantId },
    })
    if (!conductor) return res.status(403).json({ error: 'Sin perfil de conductor' })

    let vId = vehiculoId
    if (!vId) {
      const v = await prisma.flotaVehiculo.findFirst({
        where: { conductorId: conductor.id, tenantId },
        select: { id: true },
      })
      vId = v?.id
    }
    if (!vId) return res.json([])

    const actividades = await prisma.flotaActividad.findMany({
      where: { tenantId, vehiculoId: vId },
      include: { trasladoRegistro: true },
      orderBy: { fecha: 'desc' },
      take: 15,
    })

    res.json(actividades)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener actividades' })
  }
})

// ——— PATCH /api/flota/portal/actividad/:id/llegada ——————————
// El conductor registra el km de llegada en un traslado en curso
router.patch('/actividad/:id/llegada', async (req, res) => {
  try {
    const { id: usuarioId, tenantId } = req.user
    const actividadId = req.params.id
    const km = Number(req.body.kmLlegada)

    if (!km || km <= 0) return res.status(400).json({ error: 'kmLlegada inválido' })

    const conductor = await prisma.conductor.findFirst({
      where: { usuarioId, tenantId },
    })
    if (!conductor) return res.status(403).json({ error: 'Sin perfil de conductor' })

    // Verificar que la actividad pertenece al conductor (via vehículo asignado)
    const actividad = await prisma.flotaActividad.findFirst({
      where: { id: actividadId, tenantId, tipo: 'TRASLADO' },
      include: {
        trasladoRegistro: true,
        vehiculo: true,
      },
    })
    if (!actividad) return res.status(404).json({ error: 'Actividad no encontrada' })
    if (actividad.vehiculo.conductorId !== conductor.id) {
      return res.status(403).json({ error: 'No tienes acceso a esta actividad' })
    }
    if (!actividad.trasladoRegistro) {
      return res.status(400).json({ error: 'Esta actividad no es un traslado' })
    }
    if (actividad.trasladoRegistro.kmLlegada != null) {
      return res.status(400).json({ error: 'Ya tiene km de llegada registrado' })
    }
    if (actividad.trasladoRegistro.kmSalida != null && km <= actividad.trasladoRegistro.kmSalida) {
      return res.status(400).json({ error: `Debe ser mayor al km de salida (${actividad.trasladoRegistro.kmSalida})` })
    }

    await prisma.$transaction(async tx => {
      await tx.trasladoRegistro.update({
        where: { id: actividad.trasladoRegistro.id },
        data:  { kmLlegada: km, fechaLlegada: new Date() },
      })
      if (km > actividad.vehiculo.odometroActual) {
        await tx.flotaVehiculo.update({
          where: { id: actividad.vehiculo.id },
          data:  { odometroActual: km },
        })
      }
    })

    res.json({ message: 'Llegada registrada' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al registrar llegada' })
  }
})

// ——— PATCH /api/flota/portal/actividad/:id/traslado ————————
// El conductor edita los datos de un traslado (suyo)
router.patch('/actividad/:id/traslado', async (req, res) => {
  try {
    const { id: usuarioId, tenantId } = req.user
    const actividadId = req.params.id
    const { destino, motivo, kmSalida, kmLlegada, fecha, horaSalida, horaLlegada } = req.body

    if (!destino) return res.status(400).json({ error: 'destino es obligatorio' })

    const conductor = await prisma.conductor.findFirst({
      where: { usuarioId, tenantId },
    })
    if (!conductor) return res.status(403).json({ error: 'Sin perfil de conductor' })

    const actividad = await prisma.flotaActividad.findFirst({
      where: { id: actividadId, tenantId, tipo: 'TRASLADO' },
      include: { trasladoRegistro: true, vehiculo: true },
    })
    if (!actividad) return res.status(404).json({ error: 'Actividad no encontrada' })
    if (actividad.vehiculo.conductorId !== conductor.id) {
      return res.status(403).json({ error: 'No tienes acceso a esta actividad' })
    }
    if (!actividad.trasladoRegistro) {
      return res.status(400).json({ error: 'Esta actividad no es un traslado' })
    }

    const kmS = kmSalida  ? Number(kmSalida)  : null
    const kmL = kmLlegada ? Number(kmLlegada) : null
    if (kmS && kmL && kmL <= kmS) {
      return res.status(400).json({ error: 'Km llegada debe ser mayor al de salida' })
    }

    await prisma.$transaction(async tx => {
      const baseDate = fecha || actividad.fecha.toISOString().slice(0, 10)

      // Convierte 'HH:MM' en hora Chile (America/Santiago) a un Date UTC.
      // Chile está en UTC-3 (verano) o UTC-4 (invierno). Usamos el offset
      // real del momento construyendo la fecha como si fuera hora local de
      // Santiago, luego ajustamos al UTC equivalente.
      function horaChileAUtc(fechaBase, horaStr) {
        // Intl.DateTimeFormat nos da el offset real de Santiago en ese instante.
        const isoLocal = `${fechaBase}T${horaStr}:00`
        // Construir Date asumiendo UTC primero, luego obtener el offset de Santiago.
        const tempUtc = new Date(`${isoLocal}Z`)
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone:   'America/Santiago',
          year:       'numeric', month:  '2-digit', day:    '2-digit',
          hour:       '2-digit', minute: '2-digit', second: '2-digit',
          hour12:     false,
        })
        // Reconstruir la fecha en Santiago para ese instante y calcular el desfase
        const parts = formatter.formatToParts(tempUtc)
        const get = (t) => parts.find(p => p.type === t)?.value
        const santiagoCadena = `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}Z`
        const santiagoComo  = new Date(santiagoCadena)
        // La diferencia entre tempUtc (que trata isoLocal como UTC) y la hora
        // Santiago real es el offset: tempUtc - santiagoComo = offsetMs
        const offsetMs = tempUtc.getTime() - santiagoComo.getTime()
        return new Date(tempUtc.getTime() - offsetMs)
      }

      // Calcular fechaSalida si se proporciona hora manual
      let fechaSalidaUpdate = undefined
      if (horaSalida) {
        fechaSalidaUpdate = horaChileAUtc(baseDate, horaSalida)
      }

      // Calcular fechaLlegada si se proporciona hora manual
      let fechaLlegadaUpdate = undefined
      if (kmL && horaLlegada) {
        fechaLlegadaUpdate = horaChileAUtc(baseDate, horaLlegada)
      }

      await tx.trasladoRegistro.update({
        where: { id: actividad.trasladoRegistro.id },
        data: {
          destino,
          motivo:       motivo    || null,
          kmSalida:     kmS,
          kmLlegada:    kmL,
          ...(fechaSalidaUpdate  !== undefined && { fechaSalida:  fechaSalidaUpdate  }),
          ...(fechaLlegadaUpdate !== undefined && { fechaLlegada: fechaLlegadaUpdate }),
        },
      })
      if (fecha) {
        // fecha llega como 'YYYY-MM-DD' sin hora. new Date('YYYY-MM-DD') la
        // interpreta como medianoche UTC, lo que al mostrarla en hora de
        // Chile (UTC-3) retrocede al día anterior. Anclamos a mediodía UTC
        // para que el día calendario se mantenga correcto en cualquier
        // huso horario razonable.
        await tx.flotaActividad.update({
          where: { id: actividadId },
          data:  { fecha: new Date(`${fecha}T12:00:00.000Z`) },
        })
      }
      // Actualizar odómetro si kmLlegada es el mayor
      if (kmL && kmL > actividad.vehiculo.odometroActual) {
        await tx.flotaVehiculo.update({
          where: { id: actividad.vehiculo.id },
          data:  { odometroActual: kmL },
        })
      }
    })

    res.json({ message: 'Traslado actualizado' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al actualizar traslado' })
  }
})

// ——— GET /api/flota/portal/mis-reportes ————————————————————
// El conductor ve su propio resumen mensual (todos sus vehículos)
router.get('/mis-reportes', async (req, res) => {
  try {
    const { id: usuarioId, tenantId } = req.user
    const anio = req.query.anio ? Number(req.query.anio) : new Date().getFullYear()

    const conductor = await prisma.conductor.findFirst({
      where: { usuarioId, tenantId },
    })
    if (!conductor) return res.status(404).json({ error: 'Sin perfil de conductor' })

    // Vehículos del conductor
    const vehiculos = await prisma.flotaVehiculo.findMany({
      where: { conductorId: conductor.id, tenantId },
      select: { id: true },
    })
    const vehiculoIds = vehiculos.map(v => v.id)

    const desde = new Date(`${anio}-01-01T00:00:00.000Z`)
    const hasta = new Date(`${anio + 1}-01-01T00:00:00.000Z`)

    const actividades = await prisma.flotaActividad.findMany({
      where: {
        tenantId,
        vehiculoId: { in: vehiculoIds },
        fecha: { gte: desde, lt: hasta },
      },
      include: {
        kmRegistro:          true,
        combustibleRegistro: true,
        peajeRegistro:       true,
        trasladoRegistro:    true,
      },
      orderBy: { fecha: 'asc' },
    })

    const MESES_ES = [
      'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
      'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC',
    ]

    const mesesData = Array.from({ length: 12 }, (_, i) => ({
      mesNum:          i + 1,
      mes:             MESES_ES[i],
      kmRecorridos:    0,
      litros:          0,
      montoCombustible: 0,
      montoPeajes:     0,
      nActividades:    0,
    }))

    for (const act of actividades) {
      const idx = new Date(act.fecha).getMonth()
      const m = mesesData[idx]
      m.nActividades++
      if (act.kmRegistro)          m.kmRecorridos      += act.kmRegistro.kmRecorridos || 0
      if (act.trasladoRegistro) {
        const tr = act.trasladoRegistro
        if (tr.kmSalida != null && tr.kmLlegada != null) {
          m.kmRecorridos += tr.kmLlegada - tr.kmSalida
        }
      }
      if (act.combustibleRegistro) {
        m.litros              += parseFloat(act.combustibleRegistro.litros) || 0
        m.montoCombustible    += act.combustibleRegistro.monto  || 0
      }
      if (act.peajeRegistro)       m.montoPeajes       += act.peajeRegistro.monto || 0
    }

    const mesActual = new Date().getFullYear() === anio ? new Date().getMonth() : 11
    const mesesFiltrados = mesesData.filter((_, i) => i <= mesActual)

    const totales = mesesFiltrados.reduce((acc, m) => ({
      kmRecorridos:     acc.kmRecorridos     + m.kmRecorridos,
      litros:           acc.litros           + m.litros,
      montoCombustible: acc.montoCombustible + m.montoCombustible,
      montoPeajes:      acc.montoPeajes      + m.montoPeajes,
      nActividades:     acc.nActividades     + m.nActividades,
    }), { kmRecorridos: 0, litros: 0, montoCombustible: 0, montoPeajes: 0, nActividades: 0 })

    res.json({ anio, meses: mesesFiltrados, totales })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener reportes' })
  }
})

module.exports = router
