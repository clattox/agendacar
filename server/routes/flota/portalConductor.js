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

    const { tipo, fecha, notas, odometroActual, tipoCombustible, litros, monto, estacion, autopista, sentido, vehiculoId } = req.body

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
      const kmRecorridos = odometroActual > vehiculo.odometroActual
        ? odometroActual - vehiculo.odometroActual
        : null
      await prisma.kmRegistro.create({
        data: { actividadId: actividad.id, odometroActual, kmRecorridos },
      })
      await prisma.flotaVehiculo.update({
        where: { id: vehiculo.id },
        data:  { odometroActual },
      })
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

    res.status(201).json({ message: 'Actividad registrada', actividadId: actividad.id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al registrar actividad' })
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
      if (act.combustibleRegistro) {
        m.litros              += act.combustibleRegistro.litros || 0
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
