const { PrismaClient } = require('@prisma/client')
const { Resend } = require('resend')
const prisma = new PrismaClient()

const getResend = () => new Resend(process.env.RESEND_API_KEY)
const MAIL_FROM = process.env.MAIL_FROM || 'AgendaCar <reservas@agendacar.cl>'

const formatCLP = (v) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v || 0)

const htmlCotizacion = ({ reserva, cotizacion, tenant }) => {
  const items = cotizacion.items || []
  const total = items.reduce((s, i) => s + (i.valor || 0), 0)
  const nombreTaller = tenant?.nombre || 'El taller'
  const filasItems = items.map(i => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee">${i.descripcion}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:600">${formatCLP(i.valor)}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">
        <tr><td style="background:#1C1F26;padding:24px 32px">
          <p style="color:#fff;font-size:20px;font-weight:700;margin:0">${nombreTaller}</p>
          <p style="color:#9CA3AF;font-size:13px;margin:4px 0 0">Cotización / Presupuesto de trabajo</p>
        </td></tr>
        <tr><td style="padding:28px 32px">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
            <tr>
              <td style="padding:4px 0"><span style="color:#6B7280;font-size:11px;text-transform:uppercase">Cliente</span><br><strong>${reserva.nombre}</strong></td>
              <td style="padding:4px 0"><span style="color:#6B7280;font-size:11px;text-transform:uppercase">Patente</span><br><strong>${reserva.patente}</strong></td>
            </tr>
            <tr>
              <td style="padding:4px 0"><span style="color:#6B7280;font-size:11px;text-transform:uppercase">Vehículo</span><br><strong>${[reserva.vehiculo?.marca, reserva.vehiculo?.modelo].filter(Boolean).join(' ') || '—'}</strong></td>
              <td style="padding:4px 0"><span style="color:#6B7280;font-size:11px;text-transform:uppercase">Servicio</span><br><strong>${reserva.servicio?.nombre || '—'}</strong></td>
            </tr>
          </table>
          ${items.length > 0 ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:6px;overflow:hidden;margin-bottom:16px">
            <thead>
              <tr style="background:#f9f9f9">
                <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#6B7280">Descripción</th>
                <th style="padding:8px 12px;text-align:right;font-size:11px;text-transform:uppercase;color:#6B7280">Valor</th>
              </tr>
            </thead>
            <tbody>${filasItems}</tbody>
            <tfoot>
              <tr style="background:#f9f9f9">
                <td style="padding:10px 12px;font-weight:700;font-size:15px">Total</td>
                <td style="padding:10px 12px;font-weight:700;font-size:15px;text-align:right">${formatCLP(total)}</td>
              </tr>
            </tfoot>
          </table>` : ''}
          ${cotizacion.notas ? `<p style="background:#f9f9f9;border-left:3px solid #ddd;padding:10px 14px;font-size:13px;color:#555;margin:0 0 16px"><strong>Observaciones:</strong> ${cotizacion.notas}</p>` : ''}
          <p style="color:#6B7280;font-size:12px;margin:24px 0 0">Esta cotización es un presupuesto estimado. Los valores pueden variar según la inspección definitiva del vehículo.</p>
        </td></tr>
        <tr><td style="background:#f9f9f9;padding:16px 32px;text-align:center">
          <p style="color:#9CA3AF;font-size:11px;margin:0">${nombreTaller} · Enviado por AgendaCar</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/**
 * GET /api/cotizaciones/:reservaId
 */
const getCotizacion = async (req, res) => {
  const tenantId = req.usuario?.tenantId
  if (!tenantId) return res.status(401).json({ error: 'Sin tenant' })

  const reservaId = parseInt(req.params.reservaId, 10)
  if (!reservaId) return res.status(400).json({ error: 'ID inválido' })

  try {
    const cotizacion = await prisma.cotizacion.findUnique({
      where: { reservaId },
      include: { items: { orderBy: { id: 'asc' } } }
    })
    if (!cotizacion || cotizacion.tenantId !== tenantId) {
      return res.status(404).json({ error: 'Cotización no encontrada' })
    }
    res.json(cotizacion)
  } catch (error) {
    console.error('[cotizacionController] getCotizacion:', error?.message)
    res.status(500).json({ error: 'Error al obtener cotización' })
  }
}

/**
 * POST /api/cotizaciones/:reservaId
 * Body: { notas?, items: [{ descripcion, valor }] }
 * Crea o reemplaza la cotización (una por reserva).
 */
const upsertCotizacion = async (req, res) => {
  const tenantId = req.usuario?.tenantId
  if (!tenantId) return res.status(401).json({ error: 'Sin tenant' })

  const reservaId = parseInt(req.params.reservaId, 10)
  if (!reservaId) return res.status(400).json({ error: 'ID inválido' })

  const { notas: _notas, items = [] } = req.body
  const notas = _notas ?? ''

  try {
    const reserva = await prisma.reserva.findFirst({
      where: { id: reservaId, tenantId }
    })
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' })

    const cotizacion = await prisma.$transaction(async (tx) => {
      // Eliminar cotización anterior si existe
      const anterior = await tx.cotizacion.findUnique({ where: { reservaId } })
      if (anterior) {
        await tx.itemCotizacion.deleteMany({ where: { cotizacionId: anterior.id } })
        await tx.cotizacion.delete({ where: { id: anterior.id } })
      }

      // Crear nueva cotización
      return tx.cotizacion.create({
        data: {
          reservaId,
          tenantId,
          notas: notas.trim() || null,
          items: {
            create: items
              .filter(i => i.descripcion?.trim())
              .map(i => ({
                descripcion: String(i.descripcion).trim(),
                valor: parseFloat(i.valor) || 0
              }))
          }
        },
        include: { items: { orderBy: { id: 'asc' } } }
      })
    })

    res.status(201).json(cotizacion)
  } catch (error) {
    console.error('[cotizacionController] upsertCotizacion:', error?.message)
    res.status(500).json({ error: error?.message || 'Error al guardar cotización' })
  }
}

/**
 * POST /api/cotizaciones/:reservaId/email
 * Envía la cotización guardada al email del cliente.
 */
const enviarEmailCotizacion = async (req, res) => {
  const tenantId = req.usuario?.tenantId
  if (!tenantId) return res.status(401).json({ error: 'Sin tenant' })

  const reservaId = parseInt(req.params.reservaId, 10)
  if (!reservaId) return res.status(400).json({ error: 'ID inválido' })

  try {
    const cotizacion = await prisma.cotizacion.findUnique({
      where: { reservaId },
      include: { items: { orderBy: { id: 'asc' } } }
    })
    if (!cotizacion || cotizacion.tenantId !== tenantId) {
      return res.status(404).json({ error: 'Cotización no encontrada' })
    }

    const reserva = await prisma.reserva.findUnique({
      where: { id: reservaId },
      include: {
        servicio: { select: { nombre: true } },
        vehiculo: { select: { marca: true, modelo: true } },
        tenant: { select: { nombre: true } }
      }
    })

    if (!reserva?.email) {
      return res.status(400).json({ error: 'El cliente no tiene email registrado' })
    }

    const resend = getResend()
    await resend.emails.send({
      from: MAIL_FROM,
      to: reserva.email,
      subject: `Cotización de trabajo — ${reserva.patente} · ${reserva.tenant?.nombre || 'Taller'}`,
      html: htmlCotizacion({ reserva, cotizacion, tenant: reserva.tenant })
    })

    res.json({ ok: true })
  } catch (error) {
    console.error('[cotizacionController] enviarEmailCotizacion:', error?.message)
    res.status(500).json({ error: error?.message || 'Error al enviar email' })
  }
}

module.exports = { getCotizacion, upsertCotizacion, enviarEmailCotizacion }
