const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/**
 * GET /api/vehiculos/catalogo?tenantId=X
 * Endpoint público — devuelve las entradas personalizadas del catálogo del tenant.
 * El formulario público las combina con la lista hardcodeada de defaults.
 */
const listarCatalogo = async (req, res) => {
  const tenantId = parseInt(req.query.tenantId, 10)
  if (!tenantId || isNaN(tenantId)) {
    return res.status(400).json({ error: 'Falta tenantId' })
  }

  try {
    const entradas = await prisma.catalogoVehiculo.findMany({
      where: { tenantId },
      orderBy: [{ marca: 'asc' }, { modelo: 'asc' }],
      select: { id: true, marca: true, modelo: true }
    })
    res.json(entradas)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al listar catálogo' })
  }
}

/**
 * POST /api/vehiculos/catalogo
 * Body: { marca, modelo }
 * Agrega una nueva entrada al catálogo del tenant autenticado.
 */
const agregarCatalogo = async (req, res) => {
  const tenantId = req.usuario?.tenantId
  if (!tenantId) return res.status(401).json({ error: 'Token sin tenant asociado' })

  const marca  = String(req.body.marca  || '').trim()
  const modelo = String(req.body.modelo || '').trim()

  if (!marca) return res.status(400).json({ error: 'La marca es obligatoria.' })

  try {
    const entrada = await prisma.catalogoVehiculo.create({
      data: { marca, modelo, tenantId }
    })
    res.status(201).json(entrada)
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: `La entrada "${marca} ${modelo}".trim() ya existe.` })
    }
    console.error(error)
    res.status(500).json({ error: 'Error al agregar entrada al catálogo.' })
  }
}

/**
 * DELETE /api/vehiculos/catalogo/:id
 * Elimina una entrada del catálogo (validando que pertenece al tenant).
 */
const eliminarCatalogo = async (req, res) => {
  const tenantId = req.usuario?.tenantId
  if (!tenantId) return res.status(401).json({ error: 'Token sin tenant asociado' })

  const id = parseInt(req.params.id, 10)
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' })

  try {
    const entrada = await prisma.catalogoVehiculo.findFirst({
      where: { id, tenantId }
    })
    if (!entrada) return res.status(404).json({ error: 'Entrada no encontrada.' })

    await prisma.catalogoVehiculo.delete({ where: { id } })
    res.json({ ok: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al eliminar entrada del catálogo.' })
  }
}

module.exports = { listarCatalogo, agregarCatalogo, eliminarCatalogo }
