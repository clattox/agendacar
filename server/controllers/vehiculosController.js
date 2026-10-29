const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const normalizarPatente = patente => String(patente || '').trim().toUpperCase()

// Crear un vehículo manualmente en el tenant.
const crearVehiculo = async (req, res) => {
  const tenantId = req.usuario?.tenantId
  if (!tenantId) return res.status(401).json({ error: 'Token sin tenant asociado' })

  const patente = normalizarPatente(req.body.patente)
  if (!patente) return res.status(400).json({ error: 'La patente es obligatoria.' })

  const { marca, modelo, anio, kilometraje } = req.body

  try {
    const existe = await prisma.vehiculo.findUnique({
      where: { patente_tenantId: { patente, tenantId } }
    })
    if (existe) return res.status(409).json({ error: `La patente ${patente} ya está registrada.` })

    const vehiculo = await prisma.vehiculo.create({
      data: {
        patente,
        tenantId,
        marca:       marca       || null,
        modelo:      modelo      || null,
        anio:        anio        ? Number(anio)        : null,
        kilometraje: kilometraje ? Number(kilometraje) : null
      }
    })
    res.status(201).json(vehiculo)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al crear el vehículo.' })
  }
}

// Listar todos los vehículos del tenant con sus datos.
const listarVehiculos = async (req, res) => {
  const tenantId = req.usuario?.tenantId
  if (!tenantId) return res.status(401).json({ error: 'Token sin tenant asociado' })

  try {
    const vehiculos = await prisma.vehiculo.findMany({
      where: { tenantId },
      orderBy: [{ marca: 'asc' }, { patente: 'asc' }],
      select: {
        id: true,
        patente: true,
        marca: true,
        modelo: true,
        anio: true,
        kilometraje: true,
        _count: { select: { reservas: true } }
      }
    })
    res.json(vehiculos)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al listar vehículos' })
  }
}

// Historial de atenciones de una patente dentro del tenant del token.
const obtenerHistorialVehiculo = async (req, res) => {
  const tenantId = req.usuario?.tenantId
  const patente = normalizarPatente(req.params.patente)

  if (!tenantId) {
    return res.status(401).json({ error: 'Token sin tenant asociado' })
  }

  if (!patente) {
    return res.status(400).json({ error: 'Patente inválida' })
  }

  try {
    const vehiculo = await prisma.vehiculo.findUnique({
      where: {
        patente_tenantId: {
          patente,
          tenantId
        }
      },
      include: {
        reservas: {
          orderBy: { fecha: 'desc' },
          take: 30,
          include: {
            servicio: { select: { nombre: true } },
            cierre: { select: { notas: true, items: { select: { descripcion: true, valor: true } } } }
          }
        }
      }
    })

    if (!vehiculo) {
      return res.status(404).json({ error: 'Vehículo no encontrado' })
    }

    res.json(vehiculo)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener el historial del vehículo' })
  }
}

// Actualizar marca / modelo / año / kilometraje de un vehículo del tenant.
const actualizarVehiculo = async (req, res) => {
  const tenantId = req.usuario?.tenantId
  const patente = normalizarPatente(req.params.patente)
  const { marca, modelo, anio, kilometraje } = req.body

  if (!tenantId) return res.status(401).json({ error: 'Token sin tenant asociado' })
  if (!patente)  return res.status(400).json({ error: 'Patente inválida' })

  try {
    const vehiculo = await prisma.vehiculo.findUnique({
      where: { patente_tenantId: { patente, tenantId } }
    })
    if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado' })

    const datos = {}
    if (marca       !== undefined) datos.marca       = marca       || null
    if (modelo      !== undefined) datos.modelo      = modelo      || null
    if (anio        !== undefined) datos.anio        = anio        ? Number(anio) : null
    if (kilometraje !== undefined) datos.kilometraje = kilometraje ? Number(kilometraje) : null

    const actualizado = await prisma.vehiculo.update({
      where: { patente_tenantId: { patente, tenantId } },
      data: datos
    })

    res.json(actualizado)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al actualizar el vehículo' })
  }
}

module.exports = { crearVehiculo, listarVehiculos, obtenerHistorialVehiculo, actualizarVehiculo }
