const { PrismaClient } = require('@prisma/client')
const nodemailer = require('nodemailer')

const prisma = new PrismaClient()

// Obtener reservas del día/semana (admin)
const getReservas = async (req, res) => {
  const { fecha } = req.query
  const tenantId = req.usuario.tenantId

  try {
    const fechaInicio = fecha
      ? new Date(`${fecha}T00:00:00.000Z`)
      : new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`)
    const fechaFin = new Date(fechaInicio)
    fechaFin.setUTCHours(23, 59, 59, 999)

    const reservas = await prisma.reserva.findMany({
      where: {
        tenantId,
        fecha: { gte: fechaInicio, lte: fechaFin }
      },
      include: { servicio: true, vehiculo: true },
      orderBy: { fecha: 'asc' }
    })

    res.json(reservas)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener reservas' })
  }
}

// Horas disponibles (público)
const getHorasDisponibles = async (req, res) => {
  const { tenantId, fecha, servicioId } = req.query

  try {
    const servicio = await prisma.servicio.findUnique({
      where: { id: parseInt(servicioId) }
    })

    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' })
    }

    const fechaConsulta = new Date(fecha)
    const diaSemana = fechaConsulta.getDay()

    const horario = await prisma.horario.findFirst({
      where: { tenantId: parseInt(tenantId), diaSemana, activo: true }
    })

    if (!horario) {
      return res.json({ horasDisponibles: [] })
    }

    // Generar slots según duración del servicio
    const slots = generarSlots(horario.horaInicio, horario.horaFin, servicio.duracion)

    // Obtener reservas del día para filtrar ocupadas
    const fechaInicio = new Date(fecha)
    fechaInicio.setHours(0, 0, 0, 0)
    const fechaFin = new Date(fecha)
    fechaFin.setHours(23, 59, 59, 999)

    const reservasDelDia = await prisma.reserva.findMany({
      where: {
        tenantId: parseInt(tenantId),
        fecha: { gte: fechaInicio, lte: fechaFin },
        estado: { not: 'cancelada' }
      },
      include: { servicio: true }
    })

    // Obtener bloqueos del día
    const bloqueosDia = await prisma.bloqueo.findMany({
      where: {
        tenantId: parseInt(tenantId),
        fecha: { gte: fechaInicio, lte: fechaFin }
      }
    })

    // Si hay un bloqueo de día completo (sin horas), no hay slots disponibles
    const bloqueoTotal = bloqueosDia.some(b => !b.horaInicio && !b.horaFin)
    if (bloqueoTotal) {
      return res.json({ horasDisponibles: [] })
    }

    // Filtrar slots ocupados por reservas
    const slotsOcupados = reservasDelDia.map(r => {
      const h = new Date(r.fecha)
      return `${String(h.getUTCHours()).padStart(2, '0')}:${String(h.getUTCMinutes()).padStart(2, '0')}`
    })

    // Filtrar slots que caen dentro de algún bloqueo parcial
    const slotBloqueado = (slot) => {
      return bloqueosDia.some(b => {
        if (!b.horaInicio || !b.horaFin) return false
        return slot >= b.horaInicio && slot < b.horaFin
      })
    }

    const horasDisponibles = slots.filter(s => !slotsOcupados.includes(s) && !slotBloqueado(s))

    res.json({ horasDisponibles })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener horas disponibles' })
  }
}

// Construye el timestamp de la reserva como "hora de taller" (wall-clock)
// codificada en UTC. Así "10:00" se guarda y se lee como 10:00, sin que la
// zona horaria del servidor o del navegador altere la hora elegida.
const construirFechaReserva = (fecha, hora) => {
  const [anio, mes, dia] = String(fecha).split('-').map(Number)
  const [horas, minutos] = String(hora).split(':').map(Number)
  return new Date(Date.UTC(anio, mes - 1, dia, horas, minutos, 0, 0))
}

// Crear reserva (público)
const createReserva = async (req, res) => {
  const {
    tenantId,
    nombre,
    telefono,
    email,
    patente,
    fecha,
    hora,
    servicioId,
    kilometraje,
    marca,
    modelo,
    anio
  } = req.body
  const tenantIdNumerico = parseInt(tenantId)
  const patenteNormalizada = normalizarPatente(patente)
  const kilometrajeNumerico = parseEnteroOpcional(kilometraje)
  const anioNumerico = parseEnteroOpcional(anio)
  const marcaNormalizada = normalizarTextoOpcional(marca)
  const modeloNormalizado = normalizarTextoOpcional(modelo)

  if (Number.isNaN(tenantIdNumerico) || !patenteNormalizada) {
    return res.status(400).json({ error: 'Tenant y patente son obligatorios' })
  }

  try {
    const fechaReserva = construirFechaReserva(fecha, hora)

    const reserva = await prisma.$transaction(async tx => {
      const vehiculo = await tx.vehiculo.upsert({
        where: {
          patente_tenantId: {
            patente: patenteNormalizada,
            tenantId: tenantIdNumerico
          }
        },
        update: {
          ...(kilometrajeNumerico !== null ? { kilometraje: kilometrajeNumerico } : {}),
          ...(marcaNormalizada !== null ? { marca: marcaNormalizada } : {}),
          ...(modeloNormalizado !== null ? { modelo: modeloNormalizado } : {}),
          ...(anioNumerico !== null ? { anio: anioNumerico } : {}),
          updatedAt: new Date()
        },
        create: {
          patente: patenteNormalizada,
          marca: marcaNormalizada,
          modelo: modeloNormalizado,
          anio: anioNumerico,
          kilometraje: kilometrajeNumerico,
          tenantId: tenantIdNumerico
        }
      })

      return tx.reserva.create({
        data: {
          nombre,
          telefono,
          email,
          patente: patenteNormalizada,
          fecha: fechaReserva,
          tenantId: tenantIdNumerico,
          servicioId: parseInt(servicioId),
          vehiculoId: vehiculo.id,
          kilometraje: kilometrajeNumerico
        },
        include: { servicio: true, tenant: true, vehiculo: true }
      })
    })

    // Notificar al dueño por email
    await enviarNotificacion(reserva)

    res.status(201).json(reserva)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al crear reserva' })
  }
}

// Eliminar reserva definitivamente (admin)
const deleteReserva = async (req, res) => {
  const { id } = req.params
  const tenantId = req.usuario.tenantId

  try {
    const resultado = await prisma.reserva.deleteMany({
      where: { id: parseInt(id), tenantId }
    })

    if (resultado.count === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' })
    }

    res.json({ ok: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al eliminar reserva' })
  }
}

// Reagendar reserva (admin): cambia fecha y hora sin modificar cliente,
// patente ni servicio.
const reagendarReserva = async (req, res) => {
  const { id } = req.params
  const { fecha, hora } = req.body
  const tenantId = req.usuario.tenantId
  const reservaId = parseInt(id)

  if (Number.isNaN(reservaId)) {
    return res.status(400).json({ error: 'Reserva inválida' })
  }

  if (!esFechaHoraValida(fecha, hora)) {
    return res.status(400).json({ error: 'Fecha y hora inválidas' })
  }

  try {
    const reserva = await prisma.reserva.update({
      where: { id: reservaId, tenantId },
      data: { fecha: construirFechaReserva(fecha, hora) },
      include: { servicio: true, vehiculo: true }
    })

    res.json(reserva)
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Reserva no encontrada' })
    }
    console.error(error)
    res.status(500).json({ error: 'Error al reagendar reserva' })
  }
}

// Actualizar estado (admin)
const updateEstado = async (req, res) => {
  const { id } = req.params
  const { estado } = req.body
  const tenantId = req.usuario.tenantId

  try {
    const reserva = await prisma.reserva.update({
      where: { id: parseInt(id), tenantId },
      data: { estado },
      include: { servicio: true, vehiculo: true }
    })
    res.json(reserva)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al actualizar estado' })
  }
}

// Helpers
const normalizarPatente = patente => String(patente || '').trim().toUpperCase()

const normalizarTextoOpcional = valor => {
  if (valor === undefined || valor === null) return null
  const texto = String(valor).trim()
  return texto || null
}

const parseEnteroOpcional = valor => {
  if (valor === undefined || valor === null || valor === '') return null
  const numero = Number(valor)
  return Number.isInteger(numero) && numero >= 0 ? numero : null
}

const generarSlots = (inicio, fin, duracionMin) => {
  const slots = []
  const [hInicio, mInicio] = inicio.split(':').map(Number)
  const [hFin, mFin] = fin.split(':').map(Number)

  let minutos = hInicio * 60 + mInicio
  const finMinutos = hFin * 60 + mFin

  while (minutos + duracionMin <= finMinutos) {
    const h = Math.floor(minutos / 60)
    const m = minutos % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    minutos += duracionMin
  }

  return slots
}

const esFechaHoraValida = (fecha, hora) => {
  const fechaMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(fecha || ''))
  const horaMatch = /^(\d{2}):(\d{2})$/.exec(String(hora || ''))

  if (!fechaMatch || !horaMatch) return false

  const anio = Number(fechaMatch[1])
  const mes = Number(fechaMatch[2])
  const dia = Number(fechaMatch[3])
  const horas = Number(horaMatch[1])
  const minutos = Number(horaMatch[2])
  const fechaReserva = new Date(Date.UTC(anio, mes - 1, dia, horas, minutos, 0, 0))

  return (
    fechaReserva.getUTCFullYear() === anio &&
    fechaReserva.getUTCMonth() === mes - 1 &&
    fechaReserva.getUTCDate() === dia &&
    fechaReserva.getUTCHours() === horas &&
    fechaReserva.getUTCMinutes() === minutos
  )
}

const enviarNotificacion = async (reserva) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    })

    const fecha = new Date(reserva.fecha)
    const fechaFormateada = fecha.toLocaleDateString('es-CL', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
    })
    const horaFormateada = fecha.toLocaleTimeString('es-CL', {
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC'
    })

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: reserva.tenant.email,
      subject: `Nueva reserva — ${reserva.nombre} (${reserva.patente})`,
      html: `
        <h2>Nueva reserva recibida</h2>
        <p><strong>Cliente:</strong> ${reserva.nombre}</p>
        <p><strong>Teléfono:</strong> ${reserva.telefono}</p>
        <p><strong>Patente:</strong> ${reserva.patente}</p>
        <p><strong>Servicio:</strong> ${reserva.servicio.nombre}</p>
        <p><strong>Fecha:</strong> ${fechaFormateada}</p>
        <p><strong>Hora:</strong> ${horaFormateada}</p>
      `
    })
  } catch (error) {
    console.error('Error enviando email:', error)
    // No interrumpir el flujo si falla el email
  }
}

module.exports = {
  getReservas,
  getHorasDisponibles,
  createReserva,
  reagendarReserva,
  updateEstado,
  deleteReserva
}
