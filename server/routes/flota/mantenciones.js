// routes/flota/mantenciones.js
// Gestión de plantillas y planes de mantención programada
const express = require('express')
const router  = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma  = new PrismaClient()
const { randomUUID } = require('crypto')

// Helper: calcular kmProximo y fechaProxima a partir de base + intervalo
function calcularProximos(plantilla, kmBase, fechaBase) {
  return {
    kmProximo:    (kmBase != null && plantilla.intervalKm)
      ? kmBase + plantilla.intervalKm
      : null,
    fechaProxima: (fechaBase != null && plantilla.intervalDias)
      ? new Date(new Date(fechaBase).getTime() + plantilla.intervalDias * 86400000)
      : null,
  }
}

// Helper: clasificar estado de un plan
function estadoPlan(plan, odometroActual) {
  const ahora = new Date()
  let estado = 'OK'

  if (plan.kmProximo != null && odometroActual != null) {
    const diff = plan.kmProximo - odometroActual
    if (diff <= 0)    estado = 'VENCIDA'
    else if (diff <= 1000) estado = estado === 'VENCIDA' ? 'VENCIDA' : 'PROXIMA'
  }

  if (plan.fechaProxima != null) {
    const diffMs = new Date(plan.fechaProxima) - ahora
    const diffDias = diffMs / 86400000
    if (diffDias <= 0)   estado = 'VENCIDA'
    else if (diffDias <= 30) estado = estado === 'VENCIDA' ? 'VENCIDA' : 'PROXIMA'
  }

  return estado
}

// ——— GET /api/flota/mantenciones/plantillas ———————————————————————————————
router.get('/plantillas', async (req, res) => {
  try {
    const { tenantId } = req.user
    const plantillas = await prisma.plantillaMantencion.findMany({
      where:   { tenantId, activa: true },
      orderBy: { nombre: 'asc' },
    })
    res.json(plantillas)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener plantillas' })
  }
})

// ——— POST /api/flota/mantenciones/plantillas ——————————————————————————————
router.post('/plantillas', async (req, res) => {
  try {
    const { tenantId } = req.user
    const { nombre, tipoRef, intervalKm, intervalDias } = req.body
    if (!nombre) return res.status(400).json({ error: 'nombre es obligatorio' })
    if (!intervalKm && !intervalDias)
      return res.status(400).json({ error: 'Debe indicar al menos un intervalo (km o días)' })

    const plantilla = await prisma.plantillaMantencion.create({
      data: {
        id:          randomUUID(),
        tenantId,
        nombre,
        tipoRef:      tipoRef    || null,
        intervalKm:   intervalKm  ? Number(intervalKm)  : null,
        intervalDias: intervalDias ? Number(intervalDias) : null,
      },
    })
    res.status(201).json(plantilla)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al crear plantilla' })
  }
})

// ——— PUT /api/flota/mantenciones/plantillas/:id ———————————————————————————
router.put('/plantillas/:id', async (req, res) => {
  try {
    const { tenantId } = req.user
    const { id } = req.params
    const { nombre, tipoRef, intervalKm, intervalDias } = req.body

    const existe = await prisma.plantillaMantencion.findFirst({
      where: { id, tenantId },
    })
    if (!existe) return res.status(404).json({ error: 'Plantilla no encontrada' })

    const updated = await prisma.plantillaMantencion.update({
      where: { id },
      data: {
        ...(nombre       !== undefined && { nombre }),
        ...(tipoRef      !== undefined && { tipoRef: tipoRef || null }),
        ...(intervalKm   !== undefined && { intervalKm:   intervalKm   ? Number(intervalKm)   : null }),
        ...(intervalDias !== undefined && { intervalDias: intervalDias ? Number(intervalDias) : null }),
      },
    })
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al actualizar plantilla' })
  }
})

// ——— DELETE /api/flota/mantenciones/plantillas/:id (soft delete) ——————————
router.delete('/plantillas/:id', async (req, res) => {
  try {
    const { tenantId } = req.user
    const { id } = req.params

    const existe = await prisma.plantillaMantencion.findFirst({
      where: { id, tenantId },
    })
    if (!existe) return res.status(404).json({ error: 'Plantilla no encontrada' })

    await prisma.plantillaMantencion.update({
      where: { id },
      data:  { activa: false },
    })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al eliminar plantilla' })
  }
})

// ——— GET /api/flota/mantenciones/planes/:vehiculoId ——————————————————————
router.get('/planes/:vehiculoId', async (req, res) => {
  try {
    const { tenantId } = req.user
    const { vehiculoId } = req.params

    // Verificar que el vehículo pertenece al tenant
    const vehiculo = await prisma.flotaVehiculo.findFirst({
      where: { id: vehiculoId, tenantId },
      select: { odometroActual: true },
    })
    if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado' })

    const planes = await prisma.planMantencionVehiculo.findMany({
      where:   { vehiculoId, tenantId, activo: true },
      include: { plantilla: true },
      orderBy: { createdAt: 'asc' },
    })

    const planesConEstado = planes.map(p => ({
      ...p,
      estado: estadoPlan(p, vehiculo.odometroActual),
    }))

    res.json(planesConEstado)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener planes' })
  }
})

// ——— POST /api/flota/mantenciones/planes ————————————————————————————————
router.post('/planes', async (req, res) => {
  try {
    const { tenantId } = req.user
    const { vehiculoId, plantillaId, kmBase, fechaBase, notas } = req.body
    if (!vehiculoId || !plantillaId)
      return res.status(400).json({ error: 'vehiculoId y plantillaId son obligatorios' })

    // Verificar tenant ownership
    const vehiculo = await prisma.flotaVehiculo.findFirst({
      where: { id: vehiculoId, tenantId },
    })
    if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado' })

    const plantilla = await prisma.plantillaMantencion.findFirst({
      where: { id: plantillaId, tenantId, activa: true },
    })
    if (!plantilla) return res.status(404).json({ error: 'Plantilla no encontrada' })

    const { kmProximo, fechaProxima } = calcularProximos(
      plantilla,
      kmBase   ? Number(kmBase) : null,
      fechaBase ? new Date(fechaBase) : null,
    )

    const plan = await prisma.planMantencionVehiculo.create({
      data: {
        id:          randomUUID(),
        tenantId,
        vehiculoId,
        plantillaId,
        kmBase:       kmBase   ? Number(kmBase) : null,
        fechaBase:    fechaBase ? new Date(fechaBase) : null,
        kmProximo,
        fechaProxima,
        notas:        notas || null,
      },
      include: { plantilla: true },
    })

    res.status(201).json(plan)
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Este vehículo ya tiene ese plan asignado' })
    }
    console.error(err)
    res.status(500).json({ error: 'Error al crear plan' })
  }
})

// ——— PUT /api/flota/mantenciones/planes/:id ——————————————————————————————
router.put('/planes/:id', async (req, res) => {
  try {
    const { tenantId } = req.user
    const { id } = req.params
    const { kmBase, fechaBase, notas } = req.body

    const plan = await prisma.planMantencionVehiculo.findFirst({
      where:   { id, tenantId },
      include: { plantilla: true },
    })
    if (!plan) return res.status(404).json({ error: 'Plan no encontrado' })

    const nuevoKmBase   = kmBase    != null ? Number(kmBase)      : plan.kmBase
    const nuevaFechaBase = fechaBase != null ? new Date(fechaBase) : plan.fechaBase

    const { kmProximo, fechaProxima } = calcularProximos(plan.plantilla, nuevoKmBase, nuevaFechaBase)

    const updated = await prisma.planMantencionVehiculo.update({
      where: { id },
      data: {
        kmBase:       nuevoKmBase,
        fechaBase:    nuevaFechaBase,
        kmProximo,
        fechaProxima,
        notas:        notas !== undefined ? (notas || null) : plan.notas,
        updatedAt:    new Date(),
      },
      include: { plantilla: true },
    })

    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al actualizar plan' })
  }
})

// ——— DELETE /api/flota/mantenciones/planes/:id ———————————————————————————
router.delete('/planes/:id', async (req, res) => {
  try {
    const { tenantId } = req.user
    const { id } = req.params

    const plan = await prisma.planMantencionVehiculo.findFirst({
      where: { id, tenantId },
    })
    if (!plan) return res.status(404).json({ error: 'Plan no encontrado' })

    await prisma.planMantencionVehiculo.delete({ where: { id } })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al eliminar plan' })
  }
})

// ——— GET /api/flota/mantenciones/alertas —————————————————————————————————
// Todos los planes próximos o vencidos del tenant (para dashboard)
router.get('/alertas', async (req, res) => {
  try {
    const { tenantId } = req.user

    const planes = await prisma.planMantencionVehiculo.findMany({
      where:   { tenantId, activo: true },
      include: {
        plantilla: true,
        vehiculo:  { select: { patente: true, marca: true, modelo: true, odometroActual: true } },
      },
    })

    const alertas = planes
      .map(p => ({
        ...p,
        estado: estadoPlan(p, p.vehiculo.odometroActual),
      }))
      .filter(p => p.estado !== 'OK')
      .sort((a, b) => {
        // VENCIDA primero, luego PROXIMA
        if (a.estado === b.estado) return 0
        return a.estado === 'VENCIDA' ? -1 : 1
      })

    res.json(alertas)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener alertas' })
  }
})

module.exports = router
