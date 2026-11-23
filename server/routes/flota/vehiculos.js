// routes/flota/vehiculos.js
const router  = require('express').Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// ——— GET /api/flota/vehiculos ————————————————————————————————
// Lista de vehículos con filtros opcionales
// ?estado=OPERATIVO  &conductorId=xxx  &search=patente/marca
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.user
    const { estado, conductorId, search, page = 1, limit = 50 } = req.query

    const where = { tenantId }
    if (estado)      where.estado      = estado
    if (conductorId) where.conductorId = conductorId
    if (search) {
      where.OR = [
        { patente: { contains: search, mode: 'insensitive' } },
        { marca:   { contains: search, mode: 'insensitive' } },
        { modelo:  { contains: search, mode: 'insensitive' } },
      ]
    }

    const [vehiculos, total] = await Promise.all([
      prisma.flotaVehiculo.findMany({
        where,
        include: {
          conductor: { select: { id: true, nombre: true } },
        },
        orderBy: { patente: 'asc' },
        skip:  (page - 1) * limit,
        take:  Number(limit),
      }),
      prisma.flotaVehiculo.count({ where }),
    ])

    res.json({ data: vehiculos, total, page: Number(page), limit: Number(limit) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener vehículos' })
  }
})

// ——— GET /api/flota/vehiculos/catalogo ————————————————————————
// Retorna marcas y modelos del CatalogoVehiculo del tenant
router.get('/catalogo', async (req, res) => {
  try {
    const { tenantId } = req.user
    const registros = await prisma.catalogoVehiculo.findMany({
      where: { tenantId },
      select: { marca: true, modelo: true },
      orderBy: [{ marca: 'asc' }, { modelo: 'asc' }],
    })
    // Agrupar: { marca: [modelo, ...] }
    const catalogo = {}
    for (const { marca, modelo } of registros) {
      if (!catalogo[marca]) catalogo[marca] = []
      catalogo[marca].push(modelo)
    }
    res.json({ catalogo })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener catálogo' })
  }
})

// ——— POST /api/flota/vehiculos ——————————————————————————————
// Crear vehículo
router.post('/', async (req, res) => {
  try {
    const { tenantId } = req.user
    const { marca, modelo, anio, patente, color, categoria,
            numeroInterno, region, unidadOperativa, conductorId } = req.body

    if (!marca || !modelo || !anio || !patente) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: marca, modelo, anio, patente' })
    }

    const vehiculo = await prisma.flotaVehiculo.create({
      data: {
        tenantId,
        marca, modelo, anio, patente: patente.toUpperCase(),
        color, categoria, numeroInterno,
        region: region || null,
        unidadOperativa: unidadOperativa || null,
        conductorId: conductorId || null,
      },
    })
    res.status(201).json(vehiculo)
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un vehículo con esa patente' })
    }
    console.error(err)
    res.status(500).json({ error: 'Error al crear vehículo' })
  }
})

// ——— GET /api/flota/vehiculos/:id ————————————————————————————
// Ficha completa: vehículo + conductor + documentos + última actividad
router.get('/:id', async (req, res) => {
  try {
    const { tenantId } = req.user
    const vehiculo = await prisma.flotaVehiculo.findFirst({
      where: { id: req.params.id, tenantId },
      include: {
        conductor: true,
        documentos: {
          where:   { activo: true },
          orderBy: { fechaVencimiento: 'asc' },
        },
      },
    })
    if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado' })
    res.json(vehiculo)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener vehículo' })
  }
})

// ——— PUT /api/flota/vehiculos/:id ————————————————————————————
// Actualizar vehículo (campos editables)
router.put('/:id', async (req, res) => {
  try {
    const { tenantId } = req.user
    const { marca, modelo, anio, patente, color, categoria,
            numeroInterno, region, unidadOperativa, conductorId,
            proxMantencionKm, proxMantencionFecha,
            tieneTag, estado, odometroActual } = req.body

    // Verificar que pertenece al tenant
    const existing = await prisma.flotaVehiculo.findFirst({ where: { id: req.params.id, tenantId } })
    if (!existing) return res.status(404).json({ error: 'Vehículo no encontrado' })

    const vehiculo = await prisma.flotaVehiculo.update({
      where: { id: req.params.id },
      data: {
        ...(marca && { marca }),
        ...(modelo && { modelo }),
        ...(anio && { anio }),
        ...(patente && { patente: patente.toUpperCase() }),
        ...(color !== undefined && { color }),
        ...(categoria !== undefined && { categoria }),
        ...(numeroInterno !== undefined && { numeroInterno }),
        ...(region !== undefined && { region: region || null }),
        ...(unidadOperativa !== undefined && { unidadOperativa: unidadOperativa || null }),
        ...(conductorId !== undefined && { conductorId }),
        ...(proxMantencionKm !== undefined && { proxMantencionKm }),
        ...(proxMantencionFecha !== undefined && { proxMantencionFecha: proxMantencionFecha ? new Date(proxMantencionFecha) : null }),
        ...(tieneTag !== undefined && { tieneTag: !!tieneTag }),
        ...(estado !== undefined && { estado }),
        ...(odometroActual !== undefined && odometroActual !== null && { odometroActual: Number(odometroActual) }),
      },
    })
    res.json(vehiculo)
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un vehículo con esa patente' })
    }
    console.error(err)
    res.status(500).json({ error: 'Error al actualizar vehículo' })
  }
})

// ——— GET /api/flota/vehiculos/:id/actividades ————————————————
// Historial de actividades paginado con filtro por tipo
// ?tipo=COMBUSTIBLE  &desde=2026-01-01  &hasta=2026-11-30
router.get('/:id/actividades', async (req, res) => {
  try {
    const { tenantId } = req.user
    const { tipo, desde, hasta, page = 1, limit = 30 } = req.query

    // Verificar tenant
    const vehiculo = await prisma.flotaVehiculo.findFirst({
      where: { id: req.params.id, tenantId },
      select: { id: true },
    })
    if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado' })

    const where = { vehiculoId: req.params.id, tenantId }
    if (tipo)  where.tipo  = tipo
    if (desde || hasta) {
      where.fecha = {}
      if (desde) where.fecha.gte = new Date(desde)
      if (hasta) where.fecha.lte = new Date(hasta)
    }

    const [actividades, total] = await Promise.all([
      prisma.flotaActividad.findMany({
        where,
        include: {
          kmRegistro:          true,
          combustibleRegistro: true,
          peajeRegistro:       true,
          mantencionRegistro:  true,
          trasladoRegistro:    true,
          estadoCambio:        { include: { conductorAsignado: { select: { id: true, nombre: true } } } },
          registradoPor:       { select: { id: true, nombre: true } },
        },
        orderBy: { fecha: 'desc' },
        skip:  (page - 1) * Number(limit),
        take:  Number(limit),
      }),
      prisma.flotaActividad.count({ where }),
    ])

    res.json({ data: actividades, total, page: Number(page), limit: Number(limit) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener historial' })
  }
})

// ——— GET /api/flota/vehiculos/:id/estadisticas ———————————————
// Stats del mes: gasto total, litros, km recorridos, peajes
// ?mes=2026-11
router.get('/:id/estadisticas', async (req, res) => {
  try {
    const { tenantId } = req.user
    const { mes } = req.query   // "2026-11"

    const vehiculo = await prisma.flotaVehiculo.findFirst({
      where: { id: req.params.id, tenantId },
      select: { id: true, odometroActual: true },
    })
    if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado' })

    // Rango del mes
    let desde, hasta
    if (mes) {
      const [y, m] = mes.split('-').map(Number)
      desde = new Date(y, m - 1, 1)
      hasta = new Date(y, m, 1)
    } else {
      const now = new Date()
      desde = new Date(now.getFullYear(), now.getMonth(), 1)
      hasta = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    }

    const actividades = await prisma.flotaActividad.findMany({
      where: {
        vehiculoId: req.params.id,
        tenantId,
        fecha: { gte: desde, lt: hasta },
      },
      include: {
        combustibleRegistro: true,
        peajeRegistro:       true,
        mantencionRegistro:  true,
        kmRegistro:          true,
      },
    })

    // Calcular totales
    let gastoCombustible = 0, litrosTotales = 0
    let gastoMantencion  = 0
    let gastoPeajes      = 0
    let kmRecorridos     = 0

    for (const a of actividades) {
      if (a.combustibleRegistro) {
        gastoCombustible += a.combustibleRegistro.monto
        litrosTotales    += Number(a.combustibleRegistro.litros)
      }
      if (a.peajeRegistro)      gastoPeajes      += a.peajeRegistro.monto
      if (a.mantencionRegistro?.costo) gastoMantencion += a.mantencionRegistro.costo
      if (a.kmRegistro?.kmRecorridos)  kmRecorridos    += a.kmRegistro.kmRecorridos
    }

    res.json({
      mes:              mes || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      gastoTotal:       gastoCombustible + gastoMantencion + gastoPeajes,
      gastoCombustible,
      gastoMantencion,
      gastoPeajes,
      litrosTotales,
      kmRecorridos,
      odometroActual:   vehiculo.odometroActual,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al calcular estadísticas' })
  }
})

// ——— PUT /api/flota/vehiculos/:id/actividades/:actId/combustible ———
// Admin edita una carga de combustible ya registrada
router.put('/:id/actividades/:actId/combustible', async (req, res) => {
  try {
    const { tenantId } = req.user
    const { actId }    = req.params
    const { litros, monto, tipoCombustible, estacion, odometroAlCargar } = req.body

    if (!monto || isNaN(Number(monto)) || Number(monto) <= 0) {
      return res.status(400).json({ error: 'monto es obligatorio' })
    }

    // Verificar tenant
    const actividad = await prisma.flotaActividad.findFirst({
      where: { id: actId, tenantId, tipo: 'COMBUSTIBLE' },
    })
    if (!actividad) return res.status(404).json({ error: 'Actividad no encontrada' })

    const updated = await prisma.combustibleRegistro.update({
      where: { actividadId: actId },
      data: {
        monto:             Number(monto),
        ...(litros !== undefined && { litros: litros ? Number(litros) : null }),
        ...(tipoCombustible && { tipoCombustible }),
        ...(estacion !== undefined && { estacion: estacion || null }),
        ...(odometroAlCargar !== undefined && { odometroAlCargar: odometroAlCargar ? Number(odometroAlCargar) : null }),
      },
    })
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al editar combustible' })
  }
})

// ——— POST /:id/recargar-cupon ————————————————————————————————
// Suma monto al saldo de cupón electrónico del vehículo
router.post('/:id/recargar-cupon', async (req, res) => {
  try {
    const { tenantId } = req.user
    const { id } = req.params
    const { monto } = req.body

    if (!monto || isNaN(monto) || Number(monto) <= 0) {
      return res.status(400).json({ error: 'monto debe ser un número positivo' })
    }

    const vehiculo = await prisma.flotaVehiculo.findFirst({
      where: { id, tenantId },
      select: { id: true, saldoCupon: true }
    })
    if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado' })

    const updated = await prisma.flotaVehiculo.update({
      where: { id },
      data: { saldoCupon: vehiculo.saldoCupon + Number(monto) }
    })

    res.json({ saldoCupon: updated.saldoCupon })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al recargar cupón' })
  }
})

module.exports = router
