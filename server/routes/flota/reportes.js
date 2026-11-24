// routes/flota/reportes.js
// Genera los datos para el reporte Excel de flota.
// Sin dependencias nuevas — el Excel se construye en el browser con SheetJS desde CDN.

const router = require('express').Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const MESES_ES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
]

// ——— GET /api/flota/reportes/vehiculos-lista ——————————————————
// Devuelve lista de vehículos activos para el selector del reporte
router.get('/vehiculos-lista', async (req, res) => {
  try {
    const { tenantId } = req.user
    const vehiculos = await prisma.flotaVehiculo.findMany({
      where:   { tenantId, estado: { not: 'FUERA_DE_SERVICIO' } },
      select:  { id: true, patente: true, marca: true, modelo: true },
      orderBy: { patente: 'asc' },
    })
    res.json(vehiculos)
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener vehículos' })
  }
})

// ——— GET /api/flota/reportes/mensual ————————————————————————————
// ?anio=2026   (default: año actual)
// ?vehiculoId= (opcional, filtra por vehículo)
// Retorna resumen mensual de TODA la flota (o de un vehículo): km / combustible / peajes / N° actividades
router.get('/mensual', async (req, res) => {
  try {
    const { tenantId } = req.user
    const anio       = req.query.anio       ? Number(req.query.anio) : new Date().getFullYear()
    const vehiculoId = req.query.vehiculoId || null

    // Si se pasa vehiculoId, verificar que pertenece al tenant
    if (vehiculoId) {
      const veh = await prisma.flotaVehiculo.findFirst({ where: { id: vehiculoId, tenantId } })
      if (!veh) return res.status(404).json({ error: 'Vehículo no encontrado' })
    }

    const desde = new Date(`${anio}-01-01T00:00:00.000Z`)
    const hasta  = new Date(`${anio + 1}-01-01T00:00:00.000Z`)

    const whereClause = {
      tenantId,
      fecha: { gte: desde, lt: hasta },
      ...(vehiculoId ? { vehiculoId } : {}),
    }

    const actividades = await prisma.flotaActividad.findMany({
      where:   whereClause,
      include: {
        kmRegistro:          true,
        combustibleRegistro: true,
        peajeRegistro:       true,
        trasladoRegistro:    true,
      },
      orderBy: { fecha: 'asc' },
    })

    // Agrupar por mes (0-indexed)
    // kmOdometros: array de todos los odómetros registrados en el mes
    // para calcular max - min al final
    const mesesData = Array.from({ length: 12 }, (_, i) => ({
      mesNum:        i + 1,
      mes:           MESES_ES[i],
      kmOdometros:   [],   // todos los odómetros del mes
      litros:        0,
      montoCombustible: 0,
      montoPeajes:   0,
      nActividades:  0,
    }))

    for (const act of actividades) {
      const idx = new Date(act.fecha).getMonth() // 0-11
      const m = mesesData[idx]
      m.nActividades++

      // Recolectar todos los odómetros disponibles en cualquier tipo de actividad
      if (act.kmRegistro?.odometroActual)         m.kmOdometros.push(act.kmRegistro.odometroActual)
      if (act.combustibleRegistro?.odometroAlCargar) m.kmOdometros.push(act.combustibleRegistro.odometroAlCargar)
      if (act.trasladoRegistro?.kmSalida)         m.kmOdometros.push(act.trasladoRegistro.kmSalida)
      if (act.trasladoRegistro?.kmLlegada)        m.kmOdometros.push(act.trasladoRegistro.kmLlegada)

      if (act.combustibleRegistro) {
        m.litros           += act.combustibleRegistro.litros || 0
        m.montoCombustible += act.combustibleRegistro.monto  || 0
      }
      if (act.peajeRegistro) m.montoPeajes += act.peajeRegistro.monto || 0
    }

    // Calcular km recorridos como max - min de odómetros del mes
    const mesesConKm = mesesData.map(m => {
      const odometros = m.kmOdometros.filter(k => k > 0)
      const kmRecorridos = odometros.length >= 2
        ? Math.max(...odometros) - Math.min(...odometros)
        : 0
      const { kmOdometros: _, ...rest } = m
      return { ...rest, kmRecorridos }
    })

    // Totales anuales
    const totales = mesesConKm.reduce((acc, m) => ({
      kmRecorridos:     acc.kmRecorridos     + m.kmRecorridos,
      litros:           acc.litros           + m.litros,
      montoCombustible: acc.montoCombustible + m.montoCombustible,
      montoPeajes:      acc.montoPeajes      + m.montoPeajes,
      nActividades:     acc.nActividades     + m.nActividades,
    }), { kmRecorridos: 0, litros: 0, montoCombustible: 0, montoPeajes: 0, nActividades: 0 })

    // Solo meses hasta el actual si es el año en curso
    const mesActual = new Date().getFullYear() === anio ? new Date().getMonth() : 11 // 0-indexed
    const mesesFiltrados = mesesConKm.filter((_, i) => i <= mesActual)

    res.json({ anio, meses: mesesFiltrados, totales })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al generar reporte mensual' })
  }
})

// ——— GET /api/flota/reportes/datos ——————————————————————————————
// ?anio=2026   (default: año actual)
// Retorna todas las actividades del año agrupadas por vehiculo + mes,
// listas para construir el Excel en el frontend.
router.get('/datos', async (req, res) => {
  try {
    const { tenantId } = req.user
    const anio = req.query.anio ? Number(req.query.anio) : new Date().getFullYear()

    // Rango del año completo
    const desde = new Date(`${anio}-01-01T00:00:00.000Z`)
    const hasta = new Date(`${anio + 1}-01-01T00:00:00.000Z`)

    // Tenant para nombre
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { nombre: true },
    })

    // Todas las actividades del año con sub-registros
    const actividades = await prisma.flotaActividad.findMany({
      where: {
        tenantId,
        fecha: { gte: desde, lt: hasta },
      },
      include: {
        trasladoRegistro: true,
        vehiculo: {
          select: {
            id: true,
            patente: true,
            marca: true,
            modelo: true,
            numeroInterno: true,
            conductor: { select: { nombre: true } },
          },
        },
        kmRegistro:          true,
        combustibleRegistro: true,
        peajeRegistro:       true,
      },
      orderBy: [{ vehiculoId: 'asc' }, { fecha: 'asc' }],
    })

    // ——— Agrupar por vehiculoId + mes ————————————————————————————
    // Clave: "vehiculoId_mes" (0-indexed)
    const grupos = {}

    for (const act of actividades) {
      const fecha  = new Date(act.fecha)
      const mesIdx = fecha.getMonth()          // 0-11
      const key    = `${act.vehiculoId}_${mesIdx}`

      if (!grupos[key]) {
        const v = act.vehiculo
        grupos[key] = {
          anio,
          mes:    MESES_ES[mesIdx],
          mesNum: mesIdx + 1,
          patente: v.patente,
          unidad:  v.conductor?.nombre
                   || v.numeroInterno
                   || `${v.marca} ${v.modelo}`.trim(),
          kmInicial:        null,
          kmFinal:          null,
          tipoCombustible:  null,
          gastoCombustible: 0,
          gastoPeajes:      0,
          gastoSeguros:     0,
        }
      }

      const g = grupos[key]

      // KM: recolectar todos los odómetros disponibles (kmRegistro, combustible, traslado)
      // y calcular min/max para obtener km recorridos reales del mes
      const odometros = []
      if (act.kmRegistro?.odometroActual)              odometros.push(act.kmRegistro.odometroActual)
      if (act.combustibleRegistro?.odometroAlCargar)   odometros.push(act.combustibleRegistro.odometroAlCargar)
      if (act.trasladoRegistro?.kmSalida)              odometros.push(act.trasladoRegistro.kmSalida)
      if (act.trasladoRegistro?.kmLlegada)             odometros.push(act.trasladoRegistro.kmLlegada)

      for (const odo of odometros) {
        if (odo > 0) {
          if (g.kmInicial === null || odo < g.kmInicial) g.kmInicial = odo
          if (g.kmFinal   === null || odo > g.kmFinal)   g.kmFinal   = odo
        }
      }

      // Combustible
      if (act.combustibleRegistro) {
        g.gastoCombustible += act.combustibleRegistro.monto || 0
        if (!g.tipoCombustible) {
          // Mapear enum → texto del Excel
          const tc = act.combustibleRegistro.tipoCombustible
          g.tipoCombustible = tc === 'DIESEL' ? 'Diesel' : tc.startsWith('BENCINA') ? 'Bencina' : tc
        }
      }

      // Peajes
      if (act.peajeRegistro) {
        g.gastoPeajes += act.peajeRegistro.monto || 0
      }
    }

    // ——— Construir filas ordenadas ————————————————————————————————
    const filas = Object.values(grupos)
      .sort((a, b) =>
        a.mesNum - b.mesNum ||
        a.patente.localeCompare(b.patente, 'es')
      )
      .map(g => {
        const kmInicial  = g.kmInicial ?? 0
        const kmFinal    = g.kmFinal   ?? 0
        const recorrido  = (kmFinal > kmInicial) ? kmFinal - kmInicial : 0
        const totalGasto = g.gastoCombustible + g.gastoPeajes + g.gastoSeguros
        const costoKm    = recorrido > 0 ? Math.round(totalGasto / recorrido) : 0

        return {
          anio:             g.anio,
          mes:              g.mes,
          region:           '',           // No existe en el modelo — el usuario puede completar
          unidad:           g.unidad,
          patente:          g.patente,
          kmInicial,
          kmFinal,
          recorrido,
          tipoCombustible:  g.tipoCombustible || '',
          gastoCombustible: g.gastoCombustible,
          gastoPeajes:      g.gastoPeajes,
          gastoSeguros:     0,
          totalGasto,
          costoKm,
        }
      })

    res.json({
      anio,
      tenant:    { nombre: tenant?.nombre || '' },
      filas,
      meses:     MESES_ES,
      aniosDisponibles: [anio - 1, anio, anio + 1].filter(a => a >= 2024),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al generar datos del reporte' })
  }
})

// ——— GET /api/flota/reportes/peajes-tag ——————————————————————————
// Lista todos los peajes con tag del tenant, ordenados por fecha desc.
// Incluye los que ya tienen monto (para ver historial) y los que no.
// ?pendientes=1 → solo los que tienen monto=0 (sin cargar aún)
router.get('/peajes-tag', async (req, res) => {
  try {
    const { tenantId } = req.user
    const soloPendientes = req.query.pendientes === '1'

    const peajes = await prisma.peajeRegistro.findMany({
      where: {
        esTag: true,
        actividad: { tenantId },
        ...(soloPendientes ? { monto: 0 } : {}),
      },
      include: {
        actividad: {
          select: {
            id: true,
            fecha: true,
            notas: true,
            vehiculo: {
              select: {
                id: true,
                patente: true,
                marca: true,
                modelo: true,
                numeroInterno: true,
              },
            },
          },
        },
      },
      orderBy: { actividad: { fecha: 'desc' } },
    })

    const resultado = peajes.map(p => ({
      id:        p.id,
      monto:     p.monto,
      autopista: p.autopista,
      sentido:   p.sentido,
      proposito: p.proposito,
      pendiente: p.monto === 0,
      fecha:     p.actividad.fecha,
      notas:     p.actividad.notas,
      vehiculo:  p.actividad.vehiculo,
    }))

    res.json(resultado)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener peajes con tag' })
  }
})

// ——— PUT /api/flota/reportes/peajes-tag/:id/monto ———————————————
// Admin carga o actualiza el monto de un peaje con tag.
// Body: { monto: number }
router.put('/peajes-tag/:id/monto', async (req, res) => {
  try {
    const { tenantId } = req.user
    const { id } = req.params
    const { monto } = req.body

    if (!monto || isNaN(Number(monto)) || Number(monto) <= 0) {
      return res.status(400).json({ error: 'monto debe ser un número mayor a 0' })
    }

    // Verificar que el peaje pertenece al tenant
    const peaje = await prisma.peajeRegistro.findFirst({
      where: { id, esTag: true, actividad: { tenantId } },
    })
    if (!peaje) return res.status(404).json({ error: 'Peaje no encontrado' })

    const actualizado = await prisma.peajeRegistro.update({
      where: { id },
      data:  { monto: Number(monto) },
    })

    res.json({ id: actualizado.id, monto: actualizado.monto })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al actualizar monto del peaje' })
  }
})

module.exports = router
