const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const getHorarios = async (req, res) => {
  const { tenantId } = req.query
  try {
    const horarios = await prisma.horario.findMany({
      where: { tenantId: parseInt(tenantId) },
      orderBy: { diaSemana: 'asc' }
    })
    res.json(horarios)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener horarios' })
  }
}

const updateHorarios = async (req, res) => {
  const { horarios } = req.body
  const tenantId = req.user.tenantId

  try {
    // Eliminar horarios anteriores y recrear
    await prisma.horario.deleteMany({ where: { tenantId } })
    await prisma.horario.createMany({
      data: horarios.map(h => ({ ...h, tenantId }))
    })
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar horarios' })
  }
}

module.exports = { getHorarios, updateHorarios }
