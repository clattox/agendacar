// routes/flota/conductores.js
const router = require('express').Router()
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

// GET /api/flota/conductores
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.user
    const { activo, search } = req.query

    const where = { tenantId }
    if (activo !== undefined) where.activo = activo === 'true'
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { rut:    { contains: search, mode: 'insensitive' } },
      ]
    }

    const conductores = await prisma.conductor.findMany({
      where,
      include: {
        _count: { select: { flotaVehiculos: true } },
        usuario: { select: { id: true, email: true } },
        flotaVehiculos: {
          where: { tenantId },
          select: { id: true, patente: true, marca: true, modelo: true },
          take: 1,
        },
      },
      orderBy: { nombre: 'asc' },
    })
    // Añadir vehiculoAsignado como campo directo para facilitar el frontend
    const result = conductores.map(c => ({
      ...c,
      vehiculoAsignado: c.flotaVehiculos?.[0] ?? null,
    }))
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener conductores' })
  }
})

// POST /api/flota/conductores
router.post('/', async (req, res) => {
  try {
    const { tenantId } = req.user
    const { nombre, rut, licenciaNumero, licenciaCategoria,
            licenciaVence, telefono, email } = req.body

    if (!nombre) return res.status(400).json({ error: 'nombre es obligatorio' })

    const conductor = await prisma.conductor.create({
      data: {
        tenantId, nombre, rut: rut || null,
        licenciaNumero:    licenciaNumero || null,
        licenciaCategoria: licenciaCategoria || null,
        licenciaVence:     licenciaVence ? new Date(licenciaVence) : null,
        telefono:          telefono || null,
        email:             email || null,
      },
    })
    res.status(201).json(conductor)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al crear conductor' })
  }
})

// GET /api/flota/conductores/:id
router.get('/:id', async (req, res) => {
  try {
    const { tenantId } = req.user
    const conductor = await prisma.conductor.findFirst({
      where: { id: req.params.id, tenantId },
      include: {
        vehiculos: { select: { id: true, marca: true, modelo: true, patente: true, estado: true } },
      },
    })
    if (!conductor) return res.status(404).json({ error: 'Conductor no encontrado' })
    res.json(conductor)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener conductor' })
  }
})

// PUT /api/flota/conductores/:id
router.put('/:id', async (req, res) => {
  try {
    const { tenantId } = req.user
    const existing = await prisma.conductor.findFirst({ where: { id: req.params.id, tenantId } })
    if (!existing) return res.status(404).json({ error: 'Conductor no encontrado' })

    const { nombre, rut, licenciaNumero, licenciaCategoria,
            licenciaVence, telefono, email, activo } = req.body

    const conductor = await prisma.conductor.update({
      where: { id: req.params.id },
      data: {
        ...(nombre             !== undefined && { nombre }),
        ...(rut                !== undefined && { rut }),
        ...(licenciaNumero     !== undefined && { licenciaNumero }),
        ...(licenciaCategoria  !== undefined && { licenciaCategoria }),
        ...(licenciaVence      !== undefined && { licenciaVence: licenciaVence ? new Date(licenciaVence) : null }),
        ...(telefono           !== undefined && { telefono }),
        ...(email              !== undefined && { email }),
        ...(activo             !== undefined && { activo }),
      },
    })
    res.json(conductor)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al actualizar conductor' })
  }
})

// ——— POST /api/flota/conductores/:id/acceso ————————————————
// Crear cuenta de acceso (usuario) para un conductor
router.post('/:id/acceso', async (req, res) => {
  try {
    const { tenantId } = req.user
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'email y password son obligatorios' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
    }

    const conductor = await prisma.conductor.findFirst({
      where: { id: req.params.id, tenantId },
    })
    if (!conductor) return res.status(404).json({ error: 'Conductor no encontrado' })
    if (conductor.usuarioId) {
      return res.status(400).json({ error: 'Este conductor ya tiene una cuenta de acceso' })
    }

    // Verificar que el email no esté en uso
    const emailExiste = await prisma.usuario.findUnique({ where: { email } })
    if (emailExiste) return res.status(400).json({ error: 'El email ya está en uso' })

    const hash = await bcrypt.hash(password, 10)
    const usuario = await prisma.usuario.create({
      data: {
        nombre:   conductor.nombre,
        email,
        password: hash,
        rol:      'conductor',
        tenantId,
      },
    })

    await prisma.conductor.update({
      where: { id: req.params.id },
      data:  { usuarioId: usuario.id },
    })

    res.status(201).json({ message: 'Acceso creado', email, usuarioId: usuario.id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al crear acceso' })
  }
})

// ——— DELETE /api/flota/conductores/:id/acceso ——————————————
// Eliminar cuenta de acceso de un conductor
router.delete('/:id/acceso', async (req, res) => {
  try {
    const { tenantId } = req.user
    const conductor = await prisma.conductor.findFirst({
      where: { id: req.params.id, tenantId },
    })
    if (!conductor) return res.status(404).json({ error: 'Conductor no encontrado' })
    if (!conductor.usuarioId) return res.status(400).json({ error: 'Este conductor no tiene cuenta de acceso' })

    await prisma.conductor.update({
      where: { id: req.params.id },
      data:  { usuarioId: null },
    })
    await prisma.usuario.delete({ where: { id: conductor.usuarioId } })

    res.json({ message: 'Acceso eliminado' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al eliminar acceso' })
  }
})

module.exports = router
