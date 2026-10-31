const { PrismaClient } = require('@prisma/client')
const { Resend } = require('resend')
const prisma = new PrismaClient()

const getResend = () => new Resend(process.env.RESEND_API_KEY)
const MAIL_FROM = process.env.MAIL_FROM || 'AgendaCar <reservas@agendacar.cl>'

const formatCLP = (v) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v || 0)

const htmlCotizacion = ({ reserva, cotizacion, tenant }) => {
  const items = cotizacion.items || []
  const subtotal = items.reduce((s, i) => s + (i.cantidad || 1) * (i.valor || 0), 0)
  const iva = cotizacion.incluyeIva ? Math.round(subtotal * 0.19) : 0
  const total = subtotal + iva
  const nombreTaller = tenant?.nombre || 'El taller'
  const validez = tenant?.cotizacionValidez || 15
  const numero = cotizacion.numero || ''
  const fecha = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const filasItems = items.map(i => {
    const lineaTotal = (i.cantidad || 1) * (i.valor || 0)
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;width:40px">${i.cantidad || 1}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee">${i.descripcion}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${formatCLP(i.valor)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:600;white-space:nowrap">${formatCLP(lineaTotal)}</td>
    </tr>`
  }).join('')

  const infoPago = [
    tenant?.rut         ? `<tr><td style="color:#6B7280;font-size:11px;padding:2px 0;width:100px">RUT</td><td style="font-size:13px;padding:2px 0">: ${tenant.rut}</td></tr>` : '',
    tenant?.banco       ? `<tr><td style="color:#6B7280;font-size:11px;padding:2px 0">BANCO</td><td style="font-size:13px;padding:2px 0">: ${tenant.banco}</td></tr>` : '',
    tenant?.tipoCuenta  ? `<tr><td style="color:#6B7280;font-size:11px;padding:2px 0">TIPO CUENTA</td><td style="font-size:13px;padding:2px 0">: ${tenant.tipoCuenta}</td></tr>` : '',
    tenant?.numeroCuenta ? `<tr><td style="color:#6B7280;font-size:11px;padding:2px 0">Nº CUENTA</td><td style="font-size:13px;padding:2px 0">: ${tenant.numeroCuenta}</td></tr>` : '',
  ].filter(Boolean).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px">
      <table width="620" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">

        <!-- Header -->
        <tr><td style="background:#1C1F26;padding:24px 32px">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                ${tenant?.logoUrl ? `<img src="${tenant.logoUrl}" alt="${nombreTaller}" style="height:48px;width:auto;object-fit:contain;margin-bottom:8px;display:block">` : ''}
                <p style="color:#fff;font-size:18px;font-weight:700;margin:0">${nombreTaller.toUpperCase()}</p>
                ${tenant?.rut ? `<p style="color:#9CA3AF;font-size:12px;margin:2px 0 0">${tenant.rut}</p>` : ''}
                ${tenant?.direccion ? `<p style="color:#9CA3AF;font-size:12px;margin:2px 0 0">${tenant.direccion}</p>` : ''}
              </td>
              <td style="text-align:right;vertical-align:top">
                <p style="color:#fff;font-size:20px;font-weight:700;margin:0">COTIZACIÓN${numero ? ` Nº${numero}` : ''}</p>
                <p style="color:#9CA3AF;font-size:12px;margin:4px 0 0">FECHA ${fecha}</p>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Datos cliente -->
        <tr><td style="padding:20px 32px 0">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-bottom:20px">
            <tr><td colspan="2" style="background:#f3f4f6;padding:6px 12px;font-size:11px;font-weight:700;text-transform:uppercase;color:#374151;letter-spacing:.4px">Datos cliente</td></tr>
            <tr>
              <td style="padding:6px 12px;font-size:11px;color:#6B7280;width:100px">CLIENTE</td>
              <td style="padding:6px 12px;font-size:13px">: <strong>${reserva.nombre}</strong></td>
            </tr>
            ${cotizacion.clienteRut ? `<tr><td style="padding:3px 12px;font-size:11px;color:#6B7280">RUT</td><td style="padding:3px 12px;font-size:13px">: ${cotizacion.clienteRut}</td></tr>` : ''}
            ${cotizacion.clienteDireccion ? `<tr><td style="padding:3px 12px;font-size:11px;color:#6B7280">DIRECCIÓN</td><td style="padding:3px 12px;font-size:13px">: ${cotizacion.clienteDireccion}</td></tr>` : ''}
            ${cotizacion.clienteComuna ? `<tr><td style="padding:3px 12px;font-size:11px;color:#6B7280">COMUNA</td><td style="padding:3px 12px;font-size:13px">: ${cotizacion.clienteComuna}</td></tr>` : ''}
            <tr><td style="padding:3px 12px;font-size:11px;color:#6B7280">PATENTE</td><td style="padding:3px 12px;font-size:13px">: ${reserva.patente}</td></tr>
            ${reserva.vehiculo ? `<tr><td style="padding:3px 12px 8px;font-size:11px;color:#6B7280">VEHÍCULO</td><td style="padding:3px 12px 8px;font-size:13px">: ${[reserva.vehiculo?.marca, reserva.vehiculo?.modelo].filter(Boolean).join(' ')}</td></tr>` : ''}
          </table>
        </td></tr>

        <!-- Tabla de ítems -->
        ${items.length > 0 ? `
        <tr><td style="padding:0 32px">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-bottom:16px">
            <thead>
              <tr style="background:#1C1F26">
                <th style="padding:8px 12px;text-align:center;font-size:11px;text-transform:uppercase;color:#9CA3AF;width:40px">CANT.</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#9CA3AF">DESCRIPCIÓN</th>
                <th style="padding:8px 12px;text-align:right;font-size:11px;text-transform:uppercase;color:#9CA3AF">PRECIO UNIT.</th>
                <th style="padding:8px 12px;text-align:right;font-size:11px;text-transform:uppercase;color:#9CA3AF">TOTAL</th>
              </tr>
            </thead>
            <tbody>${filasItems}</tbody>
          </table>
        </td></tr>` : ''}

        <!-- Totales -->
        <tr><td style="padding:0 32px 16px">
          <table cellpadding="0" cellspacing="0" style="margin-left:auto">
            ${cotizacion.incluyeIva ? `
            <tr>
              <td style="padding:3px 12px;font-size:12px;color:#6B7280">Valor Venta</td>
              <td style="padding:3px 12px;font-size:12px;text-align:right;font-weight:600">${formatCLP(subtotal)}</td>
            </tr>
            <tr>
              <td style="padding:3px 12px;font-size:12px;color:#6B7280">19% I.V.A</td>
              <td style="padding:3px 12px;font-size:12px;text-align:right;font-weight:600">${formatCLP(iva)}</td>
            </tr>` : ''}
            <tr style="border-top:2px solid #111">
              <td style="padding:8px 12px;font-size:15px;font-weight:700">TOTAL${cotizacion.incluyeIva ? ' C/IVA' : ''}</td>
              <td style="padding:8px 12px;font-size:15px;font-weight:700;text-align:right">${formatCLP(total)}</td>
            </tr>
          </table>
        </td></tr>

        <!-- Notas -->
        ${cotizacion.notas ? `<tr><td style="padding:0 32px 16px"><p style="background:#f9fafb;border-left:3px solid #d1d5db;padding:10px 14px;font-size:13px;color:#555;margin:0"><strong>Observaciones:</strong> ${cotizacion.notas}</p></td></tr>` : ''}

        <!-- Info de pago -->
        ${infoPago ? `
        <tr><td style="padding:0 32px 16px">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden">
            <tr><td colspan="2" style="background:#f3f4f6;padding:6px 12px;font-size:11px;font-weight:700;text-transform:uppercase;color:#374151;letter-spacing:.4px">Información de pago</td></tr>
            <tr><td style="padding:6px 12px;font-size:11px;color:#6B7280;width:100px">NOMBRE</td><td style="padding:6px 12px;font-size:13px">: ${nombreTaller}</td></tr>
            ${infoPago}
          </table>
        </td></tr>` : ''}

        <!-- Términos -->
        <tr><td style="padding:0 32px 24px">
          <p style="font-size:11px;color:#9CA3AF;margin:0;border-top:1px solid #f3f4f6;padding-top:12px">
            COTIZACIÓN VÁLIDA POR ${validez} DÍAS CORRIDOS DESDE LA FECHA DE EMISIÓN · Enviado por AgendaCar
          </p>
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

  const { notas: _notas, items = [], clienteRut, clienteDireccion, clienteComuna, incluyeIva } = req.body
  const notas = _notas ?? ''

  try {
    const reserva = await prisma.reserva.findFirst({
      where: { id: reservaId, tenantId }
    })
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' })

    const cotizacion = await prisma.$transaction(async (tx) => {
      // Eliminar cotización anterior si existe (conservar su número correlativo)
      let numeroCorrelativo = null
      const anterior = await tx.cotizacion.findUnique({ where: { reservaId } })
      if (anterior) {
        numeroCorrelativo = anterior.numero // conservar el número al re-guardar
        await tx.itemCotizacion.deleteMany({ where: { cotizacionId: anterior.id } })
        await tx.cotizacion.delete({ where: { id: anterior.id } })
      }

      // Asignar número correlativo si no tiene uno aún
      if (!numeroCorrelativo) {
        const [count, tenant] = await Promise.all([
          tx.cotizacion.count({ where: { tenantId } }),
          tx.tenant.findUnique({ where: { id: tenantId }, select: { cotizacionDesde: true } })
        ])
        const desde = tenant?.cotizacionDesde ?? 1
        numeroCorrelativo = desde + count
      }

      // Crear nueva cotización
      return tx.cotizacion.create({
        data: {
          reservaId,
          tenantId,
          numero: numeroCorrelativo,
          notas: notas.trim() || null,
          clienteRut: clienteRut?.trim() || null,
          clienteDireccion: clienteDireccion?.trim() || null,
          clienteComuna: clienteComuna?.trim() || null,
          incluyeIva: Boolean(incluyeIva),
          items: {
            create: items
              .filter(i => i.descripcion?.trim())
              .map(i => ({
                descripcion: String(i.descripcion).trim(),
                cantidad: parseInt(i.cantidad) || 1,
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
        tenant: { select: { nombre: true, rut: true, banco: true, tipoCuenta: true, numeroCuenta: true, cotizacionValidez: true, logoUrl: true, direccion: true } }
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
