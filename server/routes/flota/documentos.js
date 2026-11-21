// routes/flota/documentos.js
// Gestión de documentos legales: RT, SOAP, Permiso, Seguro
const router = require('express').Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const { getConfiguracion, updateConfiguracion } = require('../../controllers/alertaDocumentoController')

// ——— GET/PUT /api/flota/documentos/configuracion ——————————————
// Configuración de alertas por correo para documentos
router.get('/configuracion',  getConfiguracion)
router.put('/configuracion',  updateConfiguracion)

// ——— GET /api/flota/documentos ———————————————————————————————
// Todos los documentos activos de la flota
// ?estado=VENCIDO|CRITICO|PROXIMO|VIGENTE  &tipo=RT  &vehiculoId=xxx
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.user
    const { estado, tipo, vehiculoId } = req.query

    const hoy = new Date()
    const where = { tenantId, activo: true }
    if (tipo)       where.tipo       = tipo
    if (vehiculoId) where.vehiculoId = vehiculoId

    const documentos = await prisma.vehiculoDocumento.findMany({
      where,
      include: {
        vehiculo: { select: { id: true, marca: true, modelo: true, patente: true, estado: true } },
      },
      orderBy: { fechaVencimiento: 'asc' },
    })

    const data = documentos.map(doc => {
      const diasRestantes = Math.ceil((new Date(doc.fechaVencimiento) - hoy) / (1000 * 60 * 60 * 24))
      const alerta = diasRestantes < 0 ? 'VENCIDO' : diasRestantes <= 15 ? 'CRITICO' : diasRestantes <= 60 ? 'PROXIMO' : 'VIGENTE'
      return { ...doc, diasRestantes, alerta }
    })

    const filtrado = estado ? data.filter(d => d.alerta === estado) : data
    res.json(filtrado)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener documentos' })
  }
})

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
            monto, proveedor, archivoBase64, archivoNombre,
            cuotas, segundaCuotaPagada, segundaCuotaFecha } = req.body

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
        vehiculoId:         req.params.vehiculoId,
        tipo,
        fechaEmision:       fechaEmision    ? new Date(fechaEmision)    : null,
        fechaVencimiento:   new Date(fechaVencimiento),
        numeroDocumento:    numeroDocumento || null,
        monto:              monto || null,
        proveedor:          proveedor || null,
        archivoBase64:      archivoBase64 || null,
        archivoNombre:      archivoNombre || null,
        activo:             true,
        // Permiso de Circulación en cuotas
        cuotas:             tipo === 'PERMISO' ? (Number(cuotas) || 1) : 1,
        segundaCuotaPagada: tipo === 'PERMISO' && cuotas === 2 ? Boolean(segundaCuotaPagada) : false,
        segundaCuotaFecha:  tipo === 'PERMISO' && cuotas === 2 && segundaCuotaFecha
                              ? new Date(segundaCuotaFecha) : null,
      },
    })
    res.status(201).json(documento)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al crear documento' })
  }
})

// ——— PUT /api/flota/documentos/:documentoId ——————————————————
// Actualizar datos de un documento (segunda cuota pagada, etc.)
router.put('/:documentoId', async (req, res) => {
  try {
    const { tenantId } = req.user
    const { segundaCuotaPagada, segundaCuotaFecha } = req.body

    const doc = await prisma.vehiculoDocumento.findFirst({
      where: { id: req.params.documentoId, tenantId },
    })
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado' })

    const updated = await prisma.vehiculoDocumento.update({
      where: { id: req.params.documentoId },
      data: {
        segundaCuotaPagada: Boolean(segundaCuotaPagada),
        segundaCuotaFecha:  segundaCuotaFecha ? new Date(segundaCuotaFecha) : null,
      },
    })
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al actualizar documento' })
  }
})

module.exports = router
