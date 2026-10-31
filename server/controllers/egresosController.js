const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * GET /api/egresos?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 */
const listarEgresos = async (req, res) => {
  const tenantId = req.usuario?.tenantId
  if (!tenantId) return res.status(401).json({ error: 'Sin tenant' })

  const { desde, hasta } = req.query
  const where = { tenantId }
  if (desde || hasta) {
    where.fecha = {}
    if (desde) where.fecha.gte = new Date(desde)
    if (hasta) {
      const h = new Date(hasta)
      h.setHours(23, 59, 59, 999)
      where.fecha.lte = h
    }
  }

  try {
    const egresos = await prisma.egreso.findMany({
      where,
      orderBy: { fecha: 'desc' }
    })
    res.json(egresos)
  } catch (err) {
    console.error('[egresosController] listarEgresos:', err?.message)
    res.status(500).json({ error: 'Error al obtener egresos' })
  }
}

/**
 * POST /api/egresos
 * Body: { fecha, descripcion, monto }
 */
const crearEgreso = async (req, res) => {
  const tenantId = req.usuario?.tenantId
  if (!tenantId) return res.status(401).json({ error: 'Sin tenant' })

  const { fecha, descripcion, monto } = req.body
  if (!descripcion?.trim()) return res.status(400).json({ error: 'La descripción es obligatoria' })
  if (!monto || isNaN(monto) || Number(monto) <= 0) return res.status(400).json({ error: 'El monto debe ser mayor a 0' })

  try {
    const egreso = await prisma.egreso.create({
      data: {
        tenantId,
        fecha: fecha ? new Date(fecha) : new Date(),
        descripcion: descripcion.trim(),
        monto: parseFloat(monto)
      }
    })
    res.status(201).json(egreso)
  } catch (err) {
    console.error('[egresosController] crearEgreso:', err?.message)
    res.status(500).json({ error: 'Error al crear egreso' })
  }
}

/**
 * DELETE /api/egresos/:id
 */
const eliminarEgreso = async (req, res) => {
  const tenantId = req.usuario?.tenantId
  if (!tenantId) return res.status(401).json({ error: 'Sin tenant' })

  const id = parseInt(req.params.id, 10)
  try {
    const egreso = await prisma.egreso.findUnique({ where: { id } })
    if (!egreso || egreso.tenantId !== tenantId) {
      return res.status(404).json({ error: 'Egreso no encontrado' })
    }
    await prisma.egreso.delete({ where: { id } })
    res.json({ ok: true })
  } catch (err) {
    console.error('[egresosController] eliminarEgreso:', err?.message)
    res.status(500).json({ error: 'Error al eliminar egreso' })
  }
}

module.exports = { listarEgresos, crearEgreso, eliminarEgreso }
