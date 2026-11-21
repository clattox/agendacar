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

module.exports = router
