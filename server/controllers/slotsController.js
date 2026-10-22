const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// GET /api/slots?diaSemana=1
// Retorna los slots configurados para el tenant autenticado, opcionalmente filtrados por día.
const getSlots = async (req, res) => {
  const tenantId = req.usuario.tenantId
  const { diaSemana } = req.query

  try {
    const where = { tenantId }
    if (diaSemana !== undefined) {
      where.diaSemana = parseInt(diaSemana)
    }

    const slots = await prisma.slotDisponible.findMany({
      where,
      orderBy: [{ diaSemana: 'asc' }, { hora: 'asc' }]
    })

    res.json(slots)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener slots' })
  }
}

// PUT /api/slots
// Reemplaza completamente los slots de un día para el tenant autenticado.
// Body: { diaSemana: number, horas: string[] }
const setSlotsDia = async (req, res) => {
  const tenantId = req.usuario.tenantId
  const { diaSemana, horas } = req.body

  if (typeof diaSemana !== 'number' || diaSemana < 0 || diaSemana > 6) {
    return res.status(400).json({ error: 'diaSemana debe ser un número entre 0 y 6' })
  }

  if (!Array.isArray(horas)) {
    return res.status(400).json({ error: 'horas debe ser un array de strings HH:MM' })
  }

  // Validar formato de horas
  const reHora = /^([01]\d|2[0-3]):([0-5]\d)$/
  const horasValidas = horas.filter(h => reHora.test(String(h)))
  const horasUnicas = [...new Set(horasValidas)]

  try {
    // Reemplazar en transacción: eliminar las del día y crear las nuevas
    await prisma.$transaction(async tx => {
      await tx.slotDisponible.deleteMany({
        where: { tenantId, diaSemana }
      })

      if (horasUnicas.length > 0) {
        await tx.slotDisponible.createMany({
          data: horasUnicas.map(hora => ({ tenantId, diaSemana, hora }))
        })
      }
    })

    const result = await prisma.slotDisponible.findMany({
      where: { tenantId, diaSemana },
      orderBy: { hora: 'asc' }
    })

    res.json(result)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al guardar slots' })
  }
}

// GET /api/slots/capacidad
// Retorna la capacidad configurada para el tenant autenticado.
const getCapacidad = async (req, res) => {
  const tenantId = req.usuario.tenantId

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { capacidad: true }
    })

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant no encontrado' })
    }

    res.json({ capacidad: tenant.capacidad })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener capacidad' })
  }
}

// PUT /api/slots/capacidad
// Actualiza la capacidad simultánea del tenant. Body: { capacidad: number }
const setCapacidad = async (req, res) => {
  const tenantId = req.usuario.tenantId
  const { capacidad } = req.body

  const cap = parseInt(capacidad)
  if (Number.isNaN(cap) || cap < 1 || cap > 4) {
    return res.status(400).json({ error: 'La capacidad debe ser un número entre 1 y 4' })
  }

  try {
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { capacidad: cap },
      select: { capacidad: true }
    })

    res.json({ capacidad: tenant.capacidad })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al actualizar capacidad' })
  }
}

module.exports = { getSlots, setSlotsDia, getCapacidad, setCapacidad }
