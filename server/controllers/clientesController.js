const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * GET /api/clientes
 * Agrupa reservas del tenant por teléfono para construir una lista de clientes.
 * No requiere cambio de schema — usa los datos existentes en Reserva + Vehiculo.
 */
const listarClientes = async (req, res) => {
  const tenantId = req.usuario?.tenantId
  if (!tenantId) return res.status(401).json({ error: 'Sin tenant' })

  const { q } = req.query // búsqueda opcional

  try {
    const reservas = await prisma.reserva.findMany({
      where: { tenantId },
      include: {
        vehiculo: { select: { patente: true, marca: true, modelo: true, anio: true } },
        servicio: { select: { nombre: true } },
        cotizacion: { select: { id: true, numero: true } },
        cierre:     { select: { id: true } }
      },
      orderBy: { fecha: 'desc' }
    })

    // Agrupar por teléfono (clave principal de identidad)
    const mapa = new Map()
    for (const r of reservas) {
      const tel = r.telefono?.trim() || 'sin-telefono'
      if (!mapa.has(tel)) {
        mapa.set(tel, {
          telefono: r.telefono,
          nombre: r.nombre,
          email: r.email || null,
          vehiculos: [],
          reservas: [],
          ultimaVisita: null,
          totalVisitas: 0
        })
      }
      const cliente = mapa.get(tel)

      // Actualizar nombre/email si esta reserva es más reciente
      if (!cliente.ultimaVisita || r.fecha > cliente.ultimaVisita) {
        cliente.ultimaVisita = r.fecha
        cliente.nombre = r.nombre
        if (r.email) cliente.email = r.email
      }

      // Agregar vehículo si no está ya
      if (r.vehiculo) {
        const yaEsta = cliente.vehiculos.some(v => v.patente === r.vehiculo.patente)
        if (!yaEsta) {
          cliente.vehiculos.push({
            patente: r.vehiculo.patente,
            marca: r.vehiculo.marca,
            modelo: r.vehiculo.modelo,
            anio: r.vehiculo.anio
          })
        }
      } else if (r.patente) {
        // reserva sin vehiculo vinculado pero con patente en texto
        const yaEsta = cliente.vehiculos.some(v => v.patente === r.patente)
        if (!yaEsta) {
          cliente.vehiculos.push({ patente: r.patente, marca: null, modelo: null, anio: null })
        }
      }

      // Registro de reserva para historial
      cliente.reservas.push({
        id: r.id,
        fecha: r.fecha,
        estado: r.estado,
        servicio: r.servicio?.nombre || '—',
        patente: r.patente,
        tieneCotizacion: !!r.cotizacion,
        numeroCotizacion: r.cotizacion?.numero || null,
        tieneCierre: !!r.cierre
      })
      cliente.totalVisitas++
    }

    let clientes = Array.from(mapa.values())
      .sort((a, b) => new Date(b.ultimaVisita) - new Date(a.ultimaVisita))

    // Filtro de búsqueda
    if (q && q.trim()) {
      const term = q.trim().toLowerCase()
      clientes = clientes.filter(c =>
        c.nombre?.toLowerCase().includes(term) ||
        c.telefono?.includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.vehiculos.some(v =>
          v.patente?.toLowerCase().includes(term) ||
          v.marca?.toLowerCase().includes(term) ||
          v.modelo?.toLowerCase().includes(term)
        )
      )
    }

    res.json(clientes)
  } catch (error) {
    console.error('[clientesController] listarClientes:', error?.message)
    res.status(500).json({ error: 'Error al obtener clientes' })
  }
}

/**
 * PATCH /api/clientes/:telefono
 * Actualiza nombre y email en TODAS las reservas de ese teléfono.
 */
const actualizarCliente = async (req, res) => {
  const tenantId = req.usuario?.tenantId
  if (!tenantId) return res.status(401).json({ error: 'Sin tenant' })

  const tel = decodeURIComponent(req.params.telefono)
  const { nombre, email } = req.body

  if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' })

  try {
    const data = { nombre: nombre.trim() }
    if (email !== undefined) data.email = email?.trim() || null

    await prisma.reserva.updateMany({
      where: { tenantId, telefono: tel },
      data
    })

    res.json({ ok: true })
  } catch (error) {
    console.error('[clientesController] actualizarCliente:', error?.message)
    res.status(500).json({ error: 'Error al actualizar cliente' })
  }
}

module.exports = { listarClientes, actualizarCliente }
