const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * GET /api/cierres/:reservaId
 * Obtiene el cierre de una reserva (si existe).
 */
const getCierre = async (req, res) => {
  const tenantId = req.usuario?.tenantId
  if (!tenantId) return res.status(401).json({ error: 'Sin tenant' })

  const reservaId = parseInt(req.params.reservaId, 10)
  if (!reservaId) return res.status(400).json({ error: 'ID inválido' })

  try {
    const cierre = await prisma.cierreAtencion.findUnique({
      where: { reservaId },
      include: { items: { orderBy: { id: 'asc' } } }
    })
    if (!cierre || cierre.tenantId !== tenantId) {
      return res.status(404).json({ error: 'Cierre no encontrado' })
    }
    res.json(cierre)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener cierre' })
  }
}

/**
 * POST /api/cierres/:reservaId
 * Crea o reemplaza el cierre de una reserva.
 * Body: { notas?, items: [{ descripcion, valor }] }
 * También marca la reserva como 'atendida'.
 */
const upsertCierre = async (req, res) => {
  const tenantId = req.usuario?.tenantId
  if (!tenantId) return res.status(401).json({ error: 'Sin tenant' })

  const reservaId = parseInt(req.params.reservaId, 10)
  if (!reservaId) return res.status(400).json({ error: 'ID inválido' })

  const { notas: _notas, items = [] } = req.body
  const notas = _notas ?? ''

  try {
    // Verificar que la reserva pertenece al tenant
    const reserva = await prisma.reserva.findFirst({
      where: { id: reservaId, tenantId }
    })
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' })

    // Crear o reemplazar el cierre en una transacción
    const cierre = await prisma.$transaction(async (tx) => {
      // Eliminar cierre anterior si existe
      const anterior = await tx.cierreAtencion.findUnique({ where: { reservaId } })
      if (anterior) {
        await tx.itemCierre.deleteMany({ where: { cierreId: anterior.id } })
        await tx.cierreAtencion.delete({ where: { id: anterior.id } })
      }

      // Crear nuevo cierre
      const nuevo = await tx.cierreAtencion.create({
        data: {
          reservaId,
          tenantId,
          notas: notas.trim() || null,
          items: {
            create: items
              .filter(i => i.descripcion?.trim())
              .map(i => ({
                descripcion: String(i.descripcion).trim(),
                cantidad: parseInt(i.cantidad) || 1,
                valor: parseFloat(i.valor) || 0
              }))
          }
        },
        include: { items: { orderBy: { id: 'asc' } } }
      })

      // Marcar reserva como atendida
      await tx.reserva.update({
        where: { id: reservaId },
        data: { estado: 'atendida' }
      })

      return nuevo
    })

    res.status(201).json(cierre)
  } catch (error) {
    console.error('[cierreController] upsertCierre error:', error?.message)
    console.error('[cierreController] code:', error?.code)
    console.error('[cierreController] meta:', JSON.stringify(error?.meta))
    res.status(500).json({ error: error?.message || 'Error al guardar cierre' })
  }
}

/**
 * PATCH /api/cierres/:reservaId/notas
 * Actualiza solo las notas del cierre sin tocar los ítems ni el total.
 */
const actualizarNotasCierre = async (req, res) => {
  const tenantId = req.usuario?.tenantId
  if (!tenantId) return res.status(401).json({ error: 'Sin tenant' })

  const reservaId = parseInt(req.params.reservaId, 10)
  if (!reservaId) return res.status(400).json({ error: 'ID inválido' })

  const { notas } = req.body

  try {
    const cierre = await prisma.cierreAtencion.findUnique({ where: { reservaId } })
    if (!cierre || cierre.tenantId !== tenantId) {
      return res.status(404).json({ error: 'Cierre no encontrado' })
    }

    const actualizado = await prisma.cierreAtencion.update({
      where: { reservaId },
      data: { notas: notas?.trim() || null }
    })

    res.json(actualizado)
  } catch (error) {
    console.error('[cierreController] actualizarNotasCierre:', error?.message)
    res.status(500).json({ error: 'Error al actualizar notas' })
  }
}

module.exports = { getCierre, upsertCierre, actualizarNotasCierre }
