const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// ── GET /api/trabajadores ────────────────────────────────────────────────────
// Lista todos los trabajadores activos (e inactivos) del tenant
const listarTrabajadores = async (req, res) => {
  const tenantId = req.usuario.tenantId
  try {
    const trabajadores = await prisma.trabajador.findMany({
      where: { tenantId },
      orderBy: [{ activo: 'desc' }, { nombre: 'asc' }]
    })
    res.json(trabajadores)
  } catch (err) {
    console.error('[trabajadores] listar:', err.message)
    res.status(500).json({ error: 'Error al obtener trabajadores' })
  }
}

// ── POST /api/trabajadores ───────────────────────────────────────────────────
// Crea un trabajador
const crearTrabajador = async (req, res) => {
  const tenantId = req.usuario.tenantId
  const { nombre, cargo } = req.body

  if (!nombre?.trim()) {
    return res.status(400).json({ error: 'El nombre es obligatorio' })
  }

  try {
    const trabajador = await prisma.trabajador.create({
      data: {
        nombre: nombre.trim(),
        cargo: cargo?.trim() || null,
        tenantId
      }
    })
    res.status(201).json(trabajador)
  } catch (err) {
    console.error('[trabajadores] crear:', err.message)
    res.status(500).json({ error: 'Error al crear trabajador' })
  }
}

// ── PATCH /api/trabajadores/:id ──────────────────────────────────────────────
// Actualiza nombre, cargo o estado activo
const actualizarTrabajador = async (req, res) => {
  const tenantId = req.usuario.tenantId
  const id = parseInt(req.params.id)
  const { nombre, cargo, activo } = req.body

  try {
    // Verificar que pertenece al tenant
    const existente = await prisma.trabajador.findFirst({ where: { id, tenantId } })
    if (!existente) return res.status(404).json({ error: 'Trabajador no encontrado' })

    const datos = {}
    if (nombre !== undefined) datos.nombre = nombre.trim()
    if (cargo !== undefined)  datos.cargo  = cargo?.trim() || null
    if (activo !== undefined) datos.activo = Boolean(activo)

    const trabajador = await prisma.trabajador.update({ where: { id }, data: datos })
    res.json(trabajador)
  } catch (err) {
    console.error('[trabajadores] actualizar:', err.message)
    res.status(500).json({ error: 'Error al actualizar trabajador' })
  }
}

// ── DELETE /api/trabajadores/:id ─────────────────────────────────────────────
// Elimina solo si no tiene inspecciones asignadas; si tiene, lo desactiva
const eliminarTrabajador = async (req, res) => {
  const tenantId = req.usuario.tenantId
  const id = parseInt(req.params.id)

  try {
    const existente = await prisma.trabajador.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { inspecciones: true } } }
    })
    if (!existente) return res.status(404).json({ error: 'Trabajador no encontrado' })

    if (existente._count.inspecciones > 0) {
      // Tiene inspecciones → desactivar en vez de borrar
      const t = await prisma.trabajador.update({ where: { id }, data: { activo: false } })
      return res.json({ ...t, _desactivado: true })
    }

    await prisma.trabajador.delete({ where: { id } })
    res.json({ ok: true })
  } catch (err) {
    console.error('[trabajadores] eliminar:', err.message)
    res.status(500).json({ error: 'Error al eliminar trabajador' })
  }
}

module.exports = { listarTrabajadores, crearTrabajador, actualizarTrabajador, eliminarTrabajador }
