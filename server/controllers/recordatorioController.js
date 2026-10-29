const { PrismaClient } = require('@prisma/client')
const { Resend } = require('resend')
const prisma = new PrismaClient()

const getResend = () => new Resend(process.env.RESEND_API_KEY)
const MAIL_FROM = process.env.MAIL_FROM || 'AgendaCar <reservas@agendacar.cl>'

// Hora actual en Chile (America/Santiago)
const horaChile = () => {
  const ahora = new Date()
  const partes = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: 'America/Santiago'
  }).formatToParts(ahora)
  return parseInt(partes.find(p => p.type === 'hour').value, 10)
}

// Día de semana actual en Chile (0=Dom, 1=Lun ... 6=Sáb)
const diaChile = () => {
  const ahora = new Date()
  const partes = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: 'America/Santiago'
  }).formatToParts(ahora)
  const str = partes.find(p => p.type === 'weekday').value
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(str)
}

// Fecha de mañana en Chile como rango UTC para Prisma
const mananaRangoUTC = () => {
  const ahora = new Date()
  // Fecha de mañana en Santiago
  const manana = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Santiago' }))
  manana.setDate(manana.getDate() + 1)
  manana.setHours(0, 0, 0, 0)

  // inicio y fin del día en UTC (Santiago es UTC-3 o UTC-4)
  // Usamos un rango amplio para no depender del offset exacto
  const inicio = new Date(manana)
  inicio.setHours(inicio.getHours() + 3) // desplazar a UTC aproximado
  const fin = new Date(inicio)
  fin.setDate(fin.getDate() + 1)

  return { inicio, fin }
}

const formatCLP = v =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v || 0)

const htmlResumen = ({ tenant, reservas, fecha }) => {
  const filas = reservas.length === 0
    ? `<tr><td colspan="4" style="padding:16px;text-align:center;color:#888">Sin reservas para mañana</td></tr>`
    : reservas.map(r => {
        const hora = new Date(r.fecha).toLocaleTimeString('es-CL', {
          hour: '2-digit', minute: '2-digit', timeZone: 'America/Santiago'
        })
        return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600">${hora}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee">${r.nombre}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:monospace">${r.patente}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#555">${r.servicio?.nombre || '—'}</td>
        </tr>`
      }).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">

        <tr><td style="background:#1C1F26;padding:24px 32px">
          <p style="color:#fff;font-size:20px;font-weight:700;margin:0">${tenant.nombre}</p>
          <p style="color:#9CA3AF;font-size:13px;margin:4px 0 0">Reservas para mañana · ${fecha}</p>
        </td></tr>

        <tr><td style="padding:24px 32px 8px">
          <p style="margin:0 0 16px;color:#374151;font-size:14px">
            ${reservas.length === 0
              ? 'No tienes reservas agendadas para mañana.'
              : `Tienes <strong>${reservas.length} reserva${reservas.length > 1 ? 's' : ''}</strong> para mañana.`}
          </p>

          ${reservas.length > 0 ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:6px;overflow:hidden">
            <thead>
              <tr style="background:#f9f9f9">
                <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#6B7280">Hora</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#6B7280">Cliente</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#6B7280">Patente</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#6B7280">Servicio</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>` : ''}
        </td></tr>

        <tr><td style="background:#f9f9f9;padding:16px 32px;text-align:center">
          <p style="color:#9CA3AF;font-size:11px;margin:0">${tenant.nombre} · Recordatorio automático de AgendaCar</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/**
 * GET /api/recordatorios/check
 * Llamado por el cron de Render cada hora.
 * Verifica qué tenants tienen recordatorio activo para esta hora y día,
 * y les envía el resumen de reservas del día siguiente.
 * Protegido con CRON_SECRET en header x-cron-secret.
 */
const checkRecordatorios = async (req, res) => {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers['x-cron-secret'] !== secret) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  const hora = horaChile()
  const dia  = diaChile()

  try {
    const tenants = await prisma.tenant.findMany({
      where: { activo: true, recordatorioActivo: true, recordatorioHora: hora }
    })

    // Filtrar por día de semana
    const activos = tenants.filter(t => {
      const dias = (t.recordatorioDias || '1,2,3,4,5').split(',').map(Number)
      return dias.includes(dia)
    })

    if (activos.length === 0) {
      return res.json({ enviados: 0, hora, dia })
    }

    const { inicio, fin } = mananaRangoUTC()
    const resend = getResend()
    let enviados = 0

    for (const tenant of activos) {
      if (!tenant.email) continue

      const reservas = await prisma.reserva.findMany({
        where: {
          tenantId: tenant.id,
          fecha: { gte: inicio, lt: fin },
          estado: { in: ['pendiente', 'confirmada'] }
        },
        orderBy: { fecha: 'asc' },
        include: { servicio: { select: { nombre: true } } }
      })

      const fechaStr = inicio.toLocaleDateString('es-CL', {
        weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Santiago'
      })

      try {
        await resend.emails.send({
          from: MAIL_FROM,
          to: tenant.email,
          subject: `Agenda de mañana — ${reservas.length} reserva${reservas.length !== 1 ? 's' : ''} · ${tenant.nombre}`,
          html: htmlResumen({ tenant, reservas, fecha: fechaStr })
        })
        enviados++
      } catch (err) {
        console.error(`[recordatorio] Error enviando a ${tenant.email}:`, err?.message)
      }
    }

    res.json({ enviados, hora, dia, total: activos.length })
  } catch (error) {
    console.error('[recordatorio] checkRecordatorios:', error?.message)
    res.status(500).json({ error: error?.message || 'Error al procesar recordatorios' })
  }
}

module.exports = { checkRecordatorios }
