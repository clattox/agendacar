const { PrismaClient } = require('@prisma/client')
const nodemailer = require('nodemailer')

const prisma = new PrismaClient()

// Obtener reservas del día/semana (admin)
const getReservas = async (req, res) => {
  const { fecha } = req.query
  const tenantId = req.usuario.tenantId

  if (!tenantId) {
    return res.status(403).json({ error: 'Sin acceso a reservas: usuario sin tenant asignado.' })
  }

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
    anio,
    notas
  } = req.body
  const tenantIdNumerico = parseInt(tenantId)
  const patenteNormalizada = normalizarPatente(patente)
  const kilometrajeNumerico = parseEnteroOpcional(kilometraje)
  const anioNumerico = parseEnteroOpcional(anio)
  const marcaNormalizada = normalizarTextoOpcional(marca)
  const modeloNormalizado = normalizarTextoOpcional(modelo)
  const notasNormalizadas = notas ? String(notas).trim().slice(0, 500) || null : null

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
          kilometraje: kilometrajeNumerico,
          notas: notasNormalizadas
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

// ─── Email helpers ────────────────────────────────────────────────────────────

const crearTransporter = () =>
  nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 465,
    secure: (Number(process.env.MAIL_PORT) || 465) === 465,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  })

const baseEmail = (contenido) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AgendaCar</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
        <!-- Header -->
        <tr>
          <td style="background:#111827;padding:20px 28px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#f97316;border-radius:8px;width:32px;height:32px;text-align:center;vertical-align:middle;">
                  <span style="color:#fff;font-size:16px;font-weight:700;">A</span>
                </td>
                <td style="padding-left:10px;">
                  <span style="color:#ffffff;font-size:15px;font-weight:700;letter-spacing:-0.3px;">AgendaCar</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:28px;">
            ${contenido}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e4e4e7;padding:16px 28px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">
              Este correo fue generado automáticamente por AgendaCar · No responder
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`

const filaDato = (label, valor) => `
  <tr>
    <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
      <span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;">${label}</span>
      <p style="margin:3px 0 0;font-size:14px;font-weight:600;color:#111827;">${valor}</p>
    </td>
  </tr>
`

// Email al taller: nueva reserva recibida
const htmlNotificacionTaller = ({ reserva, fechaFormateada, horaFormateada }) =>
  baseEmail(`
    <h1 style="margin:0 0 4px;font-size:20px;font-weight:700;color:#111827;">Nueva reserva recibida</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">
      ${reserva.nombre} agendó una cita en tu taller.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${filaDato('Cliente', reserva.nombre)}
      ${reserva.telefono ? filaDato('Teléfono', `<a href="tel:${reserva.telefono}" style="color:#f97316;text-decoration:none;">${reserva.telefono}</a>`) : ''}
      ${filaDato('Patente', reserva.patente)}
      ${filaDato('Servicio', reserva.servicio.nombre + (reserva.servicio.duracion ? ` (${reserva.servicio.duracion} min)` : ''))}
      ${filaDato('Fecha', fechaFormateada)}
      ${filaDato('Hora', horaFormateada)}
    </table>
    <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">
      Reserva #${reserva.id} · Para gestionar la reserva accede a tu panel de AgendaCar.
    </p>
  `)

// Email al cliente: confirmación de su reserva
const htmlConfirmacionCliente = ({ reserva, tenant, fechaFormateada, horaFormateada }) =>
  baseEmail(`
    <h1 style="margin:0 0 4px;font-size:20px;font-weight:700;color:#111827;">Tu hora está confirmada</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">
      Hola ${reserva.nombre}, te esperamos en <strong style="color:#111827;">${tenant.nombre}</strong>.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${filaDato('Servicio', reserva.servicio.nombre + (reserva.servicio.duracion ? ` (${reserva.servicio.duracion} min)` : ''))}
      ${filaDato('Fecha', fechaFormateada)}
      ${filaDato('Hora', horaFormateada)}
      ${filaDato('Patente', reserva.patente)}
    </table>
    ${tenant.telefono ? `
    <div style="margin:20px 0 0;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px 16px;">
      <p style="margin:0;font-size:13px;color:#92400e;">
        ¿Necesitas cancelar o reagendar? Llama directamente al taller:<br>
        <a href="tel:${tenant.telefono}" style="font-weight:700;color:#f97316;text-decoration:none;">${tenant.telefono}</a>
      </p>
    </div>` : ''}
    <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">Reserva #${reserva.id}</p>
  `)

// ─── Enviar notificaciones ────────────────────────────────────────────────────

const enviarNotificacion = async (reserva) => {
  if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.warn('Email no configurado: faltan variables MAIL_HOST / MAIL_USER / MAIL_PASS')
    return
  }

  const fecha = new Date(reserva.fecha)
  const fechaFormateada = fecha.toLocaleDateString('es-CL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
  })
  const horaFormateada = fecha.toLocaleTimeString('es-CL', {
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC'
  })

  const tenant = reserva.tenant
  const promesas = []

  // 1. Notificación al taller
  if (tenant?.email) {
    promesas.push(
      crearTransporter().sendMail({
        from: `"AgendaCar" <${process.env.MAIL_USER}>`,
        to: tenant.email,
        subject: `Nueva reserva — ${reserva.nombre} (${reserva.patente})`,
        html: htmlNotificacionTaller({ reserva, fechaFormateada, horaFormateada })
      }).catch(err => console.error('Error email taller:', err.message))
    )
  }

  // 2. Confirmación al cliente (solo si dejó su email)
  if (reserva.email) {
    promesas.push(
      crearTransporter().sendMail({
        from: `"${tenant?.nombre || 'AgendaCar'}" <${process.env.MAIL_USER}>`,
        to: reserva.email,
        subject: `Reserva confirmada — ${fechaFormateada} a las ${horaFormateada}`,
        html: htmlConfirmacionCliente({ reserva, tenant, fechaFormateada, horaFormateada })
      }).catch(err => console.error('Error email cliente:', err.message))
    )
  }

  await Promise.allSettled(promesas)
}

module.exports = {
  getReservas,
  getHorasDisponibles,
  createReserva,
  reagendarReserva,
  updateEstado,
  deleteReserva
}
