const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// GET /api/vehiculos/:patente
const getHistorial = async (req, res) => {
  const { tenantId } = req.usuario
  const { patente } = req.params

  if (!tenantId) return res.status(401).json({ error: 'Sin tenant' })

  try {
    const vehiculo = await prisma.vehiculo.findUnique({
      where: { patente_tenantId: { patente: patente.toUpperCase(), tenantId } },
      include: {
        reservas: {
          orderBy: { fecha: 'desc' },
          take: 20,
          include: { servicio: { select: { nombre: true } } }
        }
      }
    })

    if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado' })

    res.json(vehiculo)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al obtener historial' })
  }
}

module.exports = { getHistorial }
