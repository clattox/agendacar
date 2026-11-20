// middleware/requireFlota.js
// Verifica que el tenant tenga el módulo de flota activo.
// Se aplica en las rutas /api/flota/* después de authMiddleware.

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

module.exports = async function requireFlota(req, res, next) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      select: { flotaActiva: true }
    })
    if (!tenant || !tenant.flotaActiva) {
      return res.status(403).json({ error: 'Módulo de flota no activado para este tenant' })
    }
    next()
  } catch (err) {
    console.error('requireFlota error:', err)
    res.status(500).json({ error: 'Error al verificar acceso a flota' })
  }
}
