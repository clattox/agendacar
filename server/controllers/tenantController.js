const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const getTenant = async (req, res) => {
  const { subdominio } = req.query
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { subdominio }
    })
    if (!tenant) return res.status(404).json({ error: 'Taller no encontrado' })
    res.json(tenant)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener información del taller' })
  }
}

const updateTenant = async (req, res) => {
  const {
    nombre, telefono, direccion, email, logoUrl, inspeccionActiva,
    recordatorioActivo, recordatorioHora, recordatorioDias
  } = req.body
  const tenantId = req.user.tenantId
  try {
    const data = { nombre, telefono, direccion: direccion || null, email, logoUrl }
    if (inspeccionActiva !== undefined) data.inspeccionActiva = inspeccionActiva

    // Recordatorio diario
    if (recordatorioActivo !== undefined) data.recordatorioActivo = Boolean(recordatorioActivo)
    if (recordatorioHora   !== undefined) data.recordatorioHora   = Number(recordatorioHora)
    if (recordatorioDias   !== undefined) data.recordatorioDias   = String(recordatorioDias)

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data
    })
    res.json(tenant)
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar información del taller' })
  }
}

module.exports = { getTenant, updateTenant }
