// routes/flota/conductores.js
const router = require('express').Router()
const { PrismaClient } = require('@prisma/client')
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
        _count: { select: { vehiculos: true } },
      },
      orderBy: { nombre: 'asc' },
    })
    res.json(conductores)
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

module.exports = router
