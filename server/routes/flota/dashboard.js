// routes/flota/dashboard.js
// Resumen ejecutivo de la flota: KPIs, alertas y gasto del mes
const router = require('express').Router()
const prisma = require('../../lib/prisma')

// ——— GET /api/flota/dashboard ————————————————————————————————
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.user

    // Rango del mes actual
    const ahora = new Date()
    const iniciomes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    const finmes    = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1)

    // Alertas: documentos que vencen en 60 días
    const hasta60 = new Date()
    hasta60.setDate(hasta60.getDate() + 60)

    const [
      totalVehiculos,
      porEstado,
      sinConductor,
      actividadesDelMes,
      documentosProximos,
    ] = await Promise.all([

      prisma.flotaVehiculo.count({ where: { tenantId } }),

      prisma.flotaVehiculo.groupBy({
        by:    ['estado'],
        where: { tenantId },
        _count: true,
      }),

      prisma.flotaVehiculo.count({
        where: { tenantId, conductorId: null, estado: 'OPERATIVO' },
      }),

      // Actividades del mes para calcular gastos
      prisma.flotaActividad.findMany({
        where: {
          tenantId,
          fecha: { gte: iniciomes, lt: finmes },
          tipo: { in: ['COMBUSTIBLE', 'PEAJE', 'MANTENCION'] },
        },
        include: {
          combustibleRegistro: true,
          peajeRegistro:       true,
          mantencionRegistro:  true,
        },
      }),

      // Documentos que vencen pronto o ya vencieron
      prisma.vehiculoDocumento.findMany({
        where: {
          tenantId,
          activo: true,
          fechaVencimiento: { lte: hasta60 },
        },
        include: {
          vehiculo: { select: { id: true, marca: true, modelo: true, patente: true } },
        },
        orderBy: { fechaVencimiento: 'asc' },
      }),
    ])

    // Mapear estado a conteos
    const estadoMap = { OPERATIVO: 0, EN_TALLER: 0, FUERA_DE_SERVICIO: 0 }
    for (const g of porEstado) estadoMap[g.estado] = g._count

    // Calcular gasto del mes
    let gastoCombustible = 0, gastoPeajes = 0, gastoMantencion = 0
    for (const a of actividadesDelMes) {
      if (a.combustibleRegistro) gastoCombustible += a.combustibleRegistro.monto
      if (a.peajeRegistro)       gastoPeajes      += a.peajeRegistro.monto
      if (a.mantencionRegistro?.costo) gastoMantencion += a.mantencionRegistro.costo
    }

    // Enriquecer documentos con días restantes
    const hoy = new Date()
    const alertasDocumentos = documentosProximos.map(doc => ({
      ...doc,
      diasRestantes: Math.ceil((doc.fechaVencimiento - hoy) / (1000 * 60 * 60 * 24)),
      alerta: (doc.fechaVencimiento < hoy) ? 'VENCIDO'
             : (Math.ceil((doc.fechaVencimiento - hoy) / 86400000) <= 15) ? 'CRITICO'
             : 'PROXIMO',
    }))

    res.json({
      vehiculos: {
        total:           totalVehiculos,
        operativos:      estadoMap.OPERATIVO,
        enTaller:        estadoMap.EN_TALLER,
        fueraDeServicio: estadoMap.FUERA_DE_SERVICIO,
        sinConductor,
      },
      gastosMes: {
        total:            gastoCombustible + gastoPeajes + gastoMantencion,
        combustible:      gastoCombustible,
        peajes:           gastoPeajes,
        mantencion:       gastoMantencion,
        mes:              `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`,
      },
      alertas: {
        documentosVencidos: alertasDocumentos.filter(d => d.alerta === 'VENCIDO'),
        documentosCriticos: alertasDocumentos.filter(d => d.alerta === 'CRITICO'),
        documentosProximos: alertasDocumentos.filter(d => d.alerta === 'PROXIMO'),
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener datos del dashboard' })
  }
})

module.exports = router
