const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const getServicios = async (req, res) => {
  const { tenantId } = req.query
  try {
    const servicios = await prisma.servicio.findMany({
      where: { tenantId: parseInt(tenantId), activo: true }
    })
    res.json(servicios)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener servicios' })
  }
}

const createServicio = async (req, res) => {
  const { nombre, duracion } = req.body
  const tenantId = req.user.tenantId
  try {
    const servicio = await prisma.servicio.create({
      data: { nombre, duracion, tenantId }
    })
    res.status(201).json(servicio)
  } catch (error) {
    res.status(500).json({ error: 'Error al crear servicio' })
  }
}

const updateServicio = async (req, res) => {
  const { id } = req.params
  const { nombre, duracion, activo } = req.body
  const tenantId = req.user.tenantId
  try {
    const servicio = await prisma.servicio.update({
      where: { id: parseInt(id), tenantId },
      data: { nombre, duracion, activo }
    })
    res.json(servicio)
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar servicio' })
  }
}

const deleteServicio = async (req, res) => {
  const { id } = req.params
  const tenantId = req.user.tenantId
  try {
    await prisma.servicio.update({
      where: { id: parseInt(id), tenantId },
      data: { activo: false }
    })
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar servicio' })
  }
}

module.exports = { getServicios, createServicio, updateServicio, deleteServicio }
