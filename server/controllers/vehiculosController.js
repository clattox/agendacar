const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const normalizarPatente = patente => String(patente || '').trim().toUpperCase()

// Historial de atenciones de una patente dentro del tenant del token.
const obtenerHistorialVehiculo = async (req, res) => {
  const tenantId = req.usuario?.tenantId
  const patente = normalizarPatente(req.params.patente)

  if (!tenantId) {
    return res.status(401).json({ error: 'Token sin tenant asociado' })
  }

  if (!patente) {
    return res.status(400).json({ error: 'Patente inválida' })
  }

  try {
    const vehiculo = await prisma.vehiculo.findUnique({
      where: {
        patente_tenantId: {
          patente,
          tenantId
        }
      },
      include: {
        reservas: {
          orderBy: { fecha: 'desc' },
          take: 20,
          include: { servicio: true }
        }
      }
    })

    if (!vehiculo) {
      return res.status(404).json({ error: 'Vehículo no encontrado' })
    }

    res.json(vehiculo)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener el historial del vehículo' })
  }
}

module.exports = { obtenerHistorialVehiculo }
