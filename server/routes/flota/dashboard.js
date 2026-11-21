// routes/flota/dashboard.js
// Resumen ejecutivo de la flota: KPIs, alertas y gasto del mes
const router = require('express').Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

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

    // Mantenciones: próximas (dentro de 1000 km o 30 días) y vencidas
    const hoy = new Date()
    const en30dias = new Date()
    en30dias.setDate(en30dias.getDate() + 30)

    const [
      totalVehiculos,
      porEstado,
      sinConductor,
      actividadesDelMes,
      documentosProximos,
      vehiculosConDatos,
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

      // Todos los vehículos con conductor y última actividad de km
      prisma.flotaVehiculo.findMany({
        where: { tenantId },
        include: {
          conductor: { select: { id: true, nombre: true } },
        },
        orderBy: { patente: 'asc' },
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
    const alertasDocumentos = documentosProximos.map(doc => ({
      ...doc,
      diasRestantes: Math.ceil((doc.fechaVencimiento - hoy) / (1000 * 60 * 60 * 24)),
      alerta: (doc.fechaVencimiento < hoy) ? 'VENCIDO'
             : (Math.ceil((doc.fechaVencimiento - hoy) / 86400000) <= 15) ? 'CRITICO'
             : 'PROXIMO',
    }))

    // Tabla operacional de vehículos
    const tablaVehiculos = vehiculosConDatos.map(v => {
      // Estado mantención
      let estadoMant = 'OK'
      const hoyMs = hoy.getTime()

      if (v.proxMantencionFecha) {
        const fechaMs = new Date(v.proxMantencionFecha).getTime()
        const diffDias = Math.ceil((fechaMs - hoyMs) / 86400000)
        if (diffDias < 0) estadoMant = 'VENCIDA'
        else if (diffDias <= 30) estadoMant = 'PROXIMA'
      }
      if (v.proxMantencionKm) {
        const diffKm = v.proxMantencionKm - v.odometroActual
        if (diffKm <= 0) estadoMant = 'VENCIDA'
        else if (diffKm <= 1000 && estadoMant !== 'VENCIDA') estadoMant = 'PROXIMA'
      }

      return {
        id:                 v.id,
        patente:            v.patente,
        marca:              v.marca,
        modelo:             v.modelo,
        anio:               v.anio,
        estado:             v.estado,
        conductor:          v.conductor,
        odometroActual:     v.odometroActual,
        proxMantencionKm:   v.proxMantencionKm,
        proxMantencionFecha:v.proxMantencionFecha,
        estadoMant,
      }
    })

    // Alertas de atención
    const mantVencidas = tablaVehiculos.filter(v => v.estadoMant === 'VENCIDA')
    const mantProximas = tablaVehiculos.filter(v => v.estadoMant === 'PROXIMA')
    const fueraDeServicio = vehiculosConDatos.filter(v => v.estado === 'FUERA_DE_SERVICIO')

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
        mantVencidas,
        mantProximas,
        fueraDeServicio: fueraDeServicio.map(v => ({
          id: v.id, patente: v.patente, marca: v.marca, modelo: v.modelo,
          conductor: v.conductor,
        })),
      },
      tablaVehiculos,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener datos del dashboard' })
  }
})

module.exports = router
