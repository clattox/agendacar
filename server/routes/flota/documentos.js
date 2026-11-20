// routes/flota/documentos.js
// Gestión de documentos legales: RT, SOAP, Permiso, Seguro
const router = require('express').Router()
const prisma = require('../../lib/prisma')

// ——— GET /api/flota/documentos/vencimientos ——————————————————
// Documentos que vencen en los próximos N días (default: 60)
// ?dias=60  &tipo=RT
router.get('/vencimientos', async (req, res) => {
  try {
    const { tenantId } = req.user
    const { dias = 60, tipo } = req.query

    const hasta = new Date()
    hasta.setDate(hasta.getDate() + Number(dias))

    const where = {
      tenantId,
      activo: true,
      fechaVencimiento: { lte: hasta },
    }
    if (tipo) where.tipo = tipo

    const documentos = await prisma.vehiculoDocumento.findMany({
      where,
      include: {
        vehiculo: { select: { id: true, marca: true, modelo: true, patente: true, estado: true } },
      },
      orderBy: { fechaVencimiento: 'asc' },
    })

    // Enriquecer con días restantes y nivel de alerta
    const hoy = new Date()
    const data = documentos.map(doc => {
      const diasRestantes = Math.ceil((doc.fechaVencimiento - hoy) / (1000 * 60 * 60 * 24))
      return {
        ...doc,
        diasRestantes,
        alerta: diasRestantes < 0 ? 'VENCIDO' : diasRestantes <= 15 ? 'CRITICO' : 'PROXIMO',
      }
    })

    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener vencimientos' })
  }
})

// ——— GET /api/flota/documentos/vehiculo/:vehiculoId ——————————
// Todos los documentos de un vehículo (historial)
router.get('/vehiculo/:vehiculoId', async (req, res) => {
  try {
    const { tenantId } = req.user

    const vehiculo = await prisma.flotaVehiculo.findFirst({
      where: { id: req.params.vehiculoId, tenantId },
      select: { id: true },
    })
    if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado' })

    const documentos = await prisma.vehiculoDocumento.findMany({
      where: { vehiculoId: req.params.vehiculoId, tenantId },
      orderBy: [{ tipo: 'asc' }, { fechaVencimiento: 'desc' }],
    })
    res.json(documentos)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener documentos' })
  }
})

// ——— POST /api/flota/documentos/vehiculo/:vehiculoId —————————
// Agregar documento directamente (sin pasar por actividad)
// Útil para carga inicial de datos históricos
router.post('/vehiculo/:vehiculoId', async (req, res) => {
  try {
    const { tenantId } = req.user
    const { tipo, fechaEmision, fechaVencimiento, numeroDocumento,
            monto, proveedor } = req.body

    if (!tipo || !fechaVencimiento) {
      return res.status(400).json({ error: 'tipo y fechaVencimiento son obligatorios' })
    }

    const vehiculo = await prisma.flotaVehiculo.findFirst({
      where: { id: req.params.vehiculoId, tenantId },
      select: { id: true },
    })
    if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado' })

    // Desactivar documento anterior del mismo tipo
    await prisma.vehiculoDocumento.updateMany({
      where: { vehiculoId: req.params.vehiculoId, tenantId, tipo, activo: true },
      data:  { activo: false },
    })

    const documento = await prisma.vehiculoDocumento.create({
      data: {
        tenantId,
        vehiculoId:      req.params.vehiculoId,
        tipo,
        fechaEmision:    fechaEmision    ? new Date(fechaEmision)    : null,
        fechaVencimiento: new Date(fechaVencimiento),
        numeroDocumento: numeroDocumento || null,
        monto:           monto || null,
        proveedor:       proveedor || null,
        activo:          true,
      },
    })
    res.status(201).json(documento)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al crear documento' })
  }
})

module.exports = router
