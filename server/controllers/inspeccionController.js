const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// ── GET /api/inspecciones/:reservaId ─────────────────────────────────────────
// Devuelve la inspección de una reserva (si existe), con sus daños
const getInspeccion = async (req, res) => {
  const tenantId = req.usuario.tenantId
  const reservaId = parseInt(req.params.reservaId)

  try {
    // Verificar que la reserva pertenece al tenant
    const reserva = await prisma.reserva.findFirst({
      where: { id: reservaId, tenantId },
      include: {
        servicio: true,
        vehiculo: true,
        inspeccion: { include: { danos: { orderBy: { createdAt: 'asc' } }, realizadaPor: true } }
      }
    })
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' })

    res.json({ reserva, inspeccion: reserva.inspeccion || null })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener inspección' })
  }
}

// ── POST /api/inspecciones/:reservaId ────────────────────────────────────────
// Crea o actualiza la inspección de una reserva
const upsertInspeccion = async (req, res) => {
  const tenantId = req.usuario.tenantId
  const reservaId = parseInt(req.params.reservaId)
  const { observaciones, realizadaPorId, danos } = req.body

  try {
    // Verificar que la reserva pertenece al tenant
    const reserva = await prisma.reserva.findFirst({
      where: { id: reservaId, tenantId }
    })
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' })

    // Verificar que el responsable pertenece al mismo tenant (si se envía)
    if (realizadaPorId) {
      const usuario = await prisma.usuario.findFirst({
        where: { id: parseInt(realizadaPorId), tenantId }
      })
      if (!usuario) return res.status(403).json({ error: 'Usuario no autorizado' })
    }

    // Upsert de la inspección principal
    const inspeccion = await prisma.inspeccion.upsert({
      where: { reservaId },
      create: {
        reservaId,
        tenantId,
        realizadaPorId: realizadaPorId ? parseInt(realizadaPorId) : null,
        observaciones: observaciones || null
      },
      update: {
        realizadaPorId: realizadaPorId ? parseInt(realizadaPorId) : null,
        observaciones: observaciones || null,
        updatedAt: new Date()
      }
    })

    // Reemplazar daños: eliminar los existentes y crear los nuevos
    await prisma.danoInspeccion.deleteMany({ where: { inspeccionId: inspeccion.id } })

    if (Array.isArray(danos) && danos.length > 0) {
      await prisma.danoInspeccion.createMany({
        data: danos.map(d => ({
          inspeccionId: inspeccion.id,
          tipo: d.tipo,
          vista: d.vista,
          posX: parseFloat(d.posX),
          posY: parseFloat(d.posY),
          ubicacion: d.ubicacion || null,
          descripcion: d.descripcion || null
        }))
      })
    }

    // Marcar la reserva como inspeccionada
    await prisma.reserva.update({
      where: { id: reservaId },
      data: { estado: 'inspeccionada' }
    })

    // Devolver la inspección completa
    const resultado = await prisma.inspeccion.findUnique({
      where: { id: inspeccion.id },
      include: { danos: { orderBy: { createdAt: 'asc' } }, realizadaPor: true }
    })

    res.json(resultado)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al guardar inspección' })
  }
}

// ── PATCH /api/inspecciones/:reservaId/confirmar ─────────────────────────────
// Registra que el cliente revisó y confirmó la inspección
const confirmarInspeccion = async (req, res) => {
  const tenantId = req.usuario.tenantId
  const reservaId = parseInt(req.params.reservaId)

  try {
    const reserva = await prisma.reserva.findFirst({
      where: { id: reservaId, tenantId },
      include: { inspeccion: true }
    })
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' })
    if (!reserva.inspeccion) return res.status(404).json({ error: 'Inspección no encontrada' })

    const inspeccion = await prisma.inspeccion.update({
      where: { id: reserva.inspeccion.id },
      data: { clienteConfirmo: true, fechaConfirmacion: new Date() },
      include: { danos: { orderBy: { createdAt: 'asc' } }, realizadaPor: true }
    })

    res.json(inspeccion)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al confirmar inspección' })
  }
}

// ── GET /api/inspecciones/vehiculo/:patente ───────────────────────────────────
// Historial de inspecciones de un vehículo por patente (dentro del tenant)
const getHistorialVehiculo = async (req, res) => {
  const tenantId = req.usuario.tenantId
  const patente = req.params.patente.toUpperCase().replace(/\s/g, '')

  try {
    const reservas = await prisma.reserva.findMany({
      where: { tenantId, patente: { contains: patente, mode: 'insensitive' } },
      include: {
        servicio: true,
        inspeccion: { include: { danos: true, realizadaPor: true } }
      },
      orderBy: { fecha: 'desc' }
    })

    res.json(reservas)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener historial' })
  }
}

module.exports = { getInspeccion, upsertInspeccion, confirmarInspeccion, getHistorialVehiculo }
