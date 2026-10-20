const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// GET /api/bloqueos  — lista bloqueos futuros del tenant
const getBloqueos = async (req, res) => {
  try {
    const tenantId = req.usuario.tenantId
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const bloqueos = await prisma.bloqueo.findMany({
      where: { tenantId, fecha: { gte: hoy } },
      orderBy: { fecha: 'asc' }
    })
    res.json(bloqueos)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener bloqueos' })
  }
}

// POST /api/bloqueos  — crear bloqueo
const createBloqueo = async (req, res) => {
  try {
    const tenantId = req.usuario.tenantId
    const { fecha, horaInicio, horaFin, motivo } = req.body

    if (!fecha) return res.status(400).json({ error: 'La fecha es requerida' })

    // Validar que horaFin > horaInicio si ambas están presentes
    if (horaInicio && horaFin && horaFin <= horaInicio) {
      return res.status(400).json({ error: 'La hora de fin debe ser mayor que la hora de inicio' })
    }

    const [anio, mes, dia] = fecha.split('-').map(Number)
    const fechaUTC = new Date(Date.UTC(anio, mes - 1, dia, 12, 0, 0))

    const bloqueo = await prisma.bloqueo.create({
      data: {
        fecha: fechaUTC,
        horaInicio: horaInicio || null,
        horaFin: horaFin || null,
        motivo: motivo || null,
        tenantId
      }
    })
    res.status(201).json(bloqueo)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al crear bloqueo' })
  }
}

// DELETE /api/bloqueos/:id
const deleteBloqueo = async (req, res) => {
  try {
    const tenantId = req.usuario.tenantId
    const id = parseInt(req.params.id)

    const bloqueo = await prisma.bloqueo.findUnique({ where: { id } })
    if (!bloqueo || bloqueo.tenantId !== tenantId) {
      return res.status(404).json({ error: 'Bloqueo no encontrado' })
    }

    await prisma.bloqueo.delete({ where: { id } })
    res.json({ ok: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al eliminar bloqueo' })
  }
}

module.exports = { getBloqueos, createBloqueo, deleteBloqueo }
