const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

// GET /api/superadmin/tenants
const getTenants = async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { reservas: true, usuarios: true } }
      }
    })
    res.json(tenants)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener tenants' })
  }
}

// POST /api/superadmin/tenants — crea tenant + usuario admin
const createTenant = async (req, res) => {
  const { nombre, subdominio, email, telefono, adminNombre, adminEmail, adminPassword, vencimiento } = req.body

  if (!nombre || !subdominio || !email || !adminEmail || !adminPassword) {
    return res.status(400).json({ error: 'Faltan campos requeridos' })
  }

  try {
    const subdominioLimpio = subdominio.toLowerCase().trim()

    const existe = await prisma.tenant.findUnique({ where: { subdominio: subdominioLimpio } })
    if (existe) {
      return res.status(409).json({ error: 'El subdominio ya está en uso' })
    }

    const hash = await bcrypt.hash(adminPassword, 10)

    const tenant = await prisma.tenant.create({
      data: {
        nombre,
        subdominio: subdominioLimpio,
        email,
        telefono: telefono || null,
        vencimiento: vencimiento ? new Date(vencimiento) : null,
        usuarios: {
          create: {
            nombre: adminNombre || nombre,
            email: adminEmail,
            password: hash,
            rol: 'admin'
          }
        }
      },
      include: { _count: { select: { reservas: true, usuarios: true } } }
    })

    res.status(201).json(tenant)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al crear tenant' })
  }
}

// PATCH /api/superadmin/tenants/:id — activar/desactivar o actualizar vencimiento
const toggleTenant = async (req, res) => {
  const id = parseInt(req.params.id)
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id } })
    if (!tenant) return res.status(404).json({ error: 'Tenant no encontrado' })

    const data = {}
    if (req.body.vencimiento !== undefined) {
      data.vencimiento = req.body.vencimiento ? new Date(req.body.vencimiento) : null
    } else {
      data.activo = !tenant.activo
    }

    const actualizado = await prisma.tenant.update({
      where: { id },
      data,
      include: { _count: { select: { reservas: true, usuarios: true } } }
    })
    res.json(actualizado)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al actualizar tenant' })
  }
}

// GET /api/superadmin/stats
const getStats = async (req, res) => {
  try {
    const [totalTenants, totalReservas, tenantActivos] = await Promise.all([
      prisma.tenant.count(),
      prisma.reserva.count(),
      prisma.tenant.count({ where: { activo: true } })
    ])
    res.json({ totalTenants, totalReservas, tenantActivos })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener estadísticas' })
  }
}

module.exports = { getTenants, createTenant, toggleTenant, getStats }
