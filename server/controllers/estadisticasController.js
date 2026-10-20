const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MESES_A_MOSTRAR = 6
const TOP_SERVICIOS = 5

const pad = value => String(value).padStart(2, '0')

// Mes calendario actual del taller. Las reservas guardan la hora local del
// taller codificada en UTC, por lo que los límites y las claves de mes se
// construyen también en UTC para no desplazar las reservas.
const obtenerMesActual = () => {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: 'numeric'
  }).formatToParts(new Date())
  const valores = Object.fromEntries(partes.map(({ type, value }) => [type, value]))

  return {
    anio: Number(valores.year),
    mes: Number(valores.month)
  }
}

// Reservas de los últimos 6 meses (mes actual incluido), agrupadas por mes.
const getResumen = async (req, res) => {
  const tenantId = req.user?.tenantId

  if (!tenantId) {
    return res.status(401).json({ error: 'Token sin tenant asociado' })
  }

  try {
    const { anio, mes } = obtenerMesActual()
    const fechaInicio = new Date(Date.UTC(anio, mes - MESES_A_MOSTRAR, 1))
    const fechaFin = new Date(Date.UTC(anio, mes, 1))

    const reservas = await prisma.reserva.findMany({
      where: {
        tenantId,
        fecha: { gte: fechaInicio, lt: fechaFin }
      },
      select: { fecha: true, estado: true }
    })

    const porMes = Array.from({ length: MESES_A_MOSTRAR }, (_, indice) => {
      const fechaMes = new Date(Date.UTC(anio, mes - MESES_A_MOSTRAR + indice, 1))
      return {
        mes: `${fechaMes.getUTCFullYear()}-${pad(fechaMes.getUTCMonth() + 1)}`,
        total: 0,
        confirmadas: 0,
        canceladas: 0
      }
    })

    const indicePorMes = new Map(porMes.map((item, indice) => [item.mes, indice]))

    reservas.forEach(reserva => {
      const fecha = new Date(reserva.fecha)
      if (Number.isNaN(fecha.getTime())) return

      const clave = `${fecha.getUTCFullYear()}-${pad(fecha.getUTCMonth() + 1)}`
      const indice = indicePorMes.get(clave)
      if (indice === undefined) return

      porMes[indice].total += 1
      if (reserva.estado === 'confirmada') porMes[indice].confirmadas += 1
      if (reserva.estado === 'cancelada') porMes[indice].canceladas += 1
    })

    res.json({ porMes })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener el resumen de estadísticas' })
  }
}

// Top 5 de servicios por cantidad de reservas del tenant.
const getServicios = async (req, res) => {
  const tenantId = req.user?.tenantId

  if (!tenantId) {
    return res.status(401).json({ error: 'Token sin tenant asociado' })
  }

  try {
    const agrupados = await prisma.reserva.groupBy({
      by: ['servicioId'],
      where: { tenantId },
      _count: { _all: true }
    })

    const top = agrupados
      .slice()
      .sort((a, b) => b._count._all - a._count._all || a.servicioId - b.servicioId)
      .slice(0, TOP_SERVICIOS)

    if (top.length === 0) {
      return res.json({ servicios: [] })
    }

    const servicios = await prisma.servicio.findMany({
      where: {
        tenantId,
        id: { in: top.map(item => item.servicioId) }
      },
      select: { id: true, nombre: true }
    })

    const nombrePorId = new Map(servicios.map(servicio => [servicio.id, servicio.nombre]))

    res.json({
      servicios: top.map(item => ({
        nombre: nombrePorId.get(item.servicioId) || 'Servicio sin nombre',
        total: item._count._all
      }))
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener los servicios más solicitados' })
  }
}

// Reservas agrupadas por día de la semana (0=domingo ... 6=sábado).
const getDias = async (req, res) => {
  const tenantId = req.user?.tenantId

  if (!tenantId) {
    return res.status(401).json({ error: 'Token sin tenant asociado' })
  }

  try {
    const reservas = await prisma.reserva.findMany({
      where: { tenantId },
      select: { fecha: true }
    })

    const totales = Array(7).fill(0)

    reservas.forEach(reserva => {
      const fecha = new Date(reserva.fecha)
      if (Number.isNaN(fecha.getTime())) return

      const diaSemana = fecha.getUTCDay()
      totales[diaSemana] += 1
    })

    res.json({
      dias: totales.map((total, diaSemana) => ({
        diaSemana,
        label: DIAS[diaSemana],
        total
      }))
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener la distribución por día' })
  }
}

module.exports = { getResumen, getServicios, getDias }
