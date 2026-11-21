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

// Devuelve los datos del tenant del usuario autenticado (para el panel admin/flota)
const getTenantMe = async (req, res) => {
  const { tenantId } = req.user
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) return res.status(404).json({ error: 'Tenant no encontrado' })
    res.json(tenant)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener datos del tenant' })
  }
}

const updateTenant = async (req, res) => {
  const {
    nombre, telefono, direccion, email, logoUrl, inspeccionActiva,
    recordatorioActivo, recordatorioHora, recordatorioDias,
    categoria, colorPrimario,
    rut, banco, tipoCuenta, numeroCuenta, cotizacionValidez, cotizacionDesde
  } = req.body
  const tenantId = req.user.tenantId
  try {
    const data = { nombre, telefono, direccion: direccion || null, email, logoUrl }
    if (inspeccionActiva !== undefined) data.inspeccionActiva = inspeccionActiva

    // Recordatorio diario
    if (recordatorioActivo !== undefined) data.recordatorioActivo = Boolean(recordatorioActivo)
    if (recordatorioHora   !== undefined) data.recordatorioHora   = Number(recordatorioHora)
    if (recordatorioDias   !== undefined) data.recordatorioDias   = String(recordatorioDias)

    // Personalización visual
    if (categoria     !== undefined) data.categoria     = String(categoria)
    if (colorPrimario !== undefined) data.colorPrimario = String(colorPrimario)

    // Datos de emisión de cotizaciones
    if (rut              !== undefined) data.rut              = rut || null
    if (banco            !== undefined) data.banco            = banco || null
    if (tipoCuenta       !== undefined) data.tipoCuenta       = tipoCuenta || null
    if (numeroCuenta     !== undefined) data.numeroCuenta     = numeroCuenta || null
    if (cotizacionValidez !== undefined) data.cotizacionValidez = Number(cotizacionValidez) || 15
    if (cotizacionDesde   !== undefined) data.cotizacionDesde   = Math.max(1, Number(cotizacionDesde) || 1)

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data
    })
    res.json(tenant)
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar información del taller' })
  }
}

module.exports = { getTenant, getTenantMe, updateTenant }
