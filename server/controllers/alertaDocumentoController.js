const { PrismaClient } = require('@prisma/client')
const { Resend } = require('resend')
const prisma = new PrismaClient()

const getResend = () => new Resend(process.env.RESEND_API_KEY)
const MAIL_FROM = process.env.MAIL_FROM_ALERTAS || 'AgendaCar Alertas <alertas@agendacar.cl>'

// Días restantes hasta una fecha (negativo si ya venció)
const diasHasta = (fecha) => {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const venc = new Date(fecha)
  venc.setHours(0, 0, 0, 0)
  return Math.round((venc - hoy) / (1000 * 60 * 60 * 24))
}

const TIPO_LABEL = {
  revision_tecnica: 'Revisión Técnica',
  permiso_circulacion: 'Permiso de Circulación',
  seguro: 'Seguro',
  soap: 'SOAP',
  otro: 'Otro',
}

const estadoBadge = (dias) => {
  if (dias < 0) return { texto: `Vencido hace ${Math.abs(dias)}d`, color: '#DC2626', bg: '#FEE2E2' }
  if (dias <= 5) return { texto: `Crítico — ${dias}d`, color: '#D97706', bg: '#FEF3C7' }
  return { texto: `Próximo — ${dias}d`, color: '#854D0E', bg: '#FEF9C3' }
}

const htmlAlerta = ({ tenant, alertas }) => {
  const filas = alertas.map(({ doc, vehiculo, dias }) => {
    const badge = estadoBadge(dias)
    const vencStr = new Date(doc.fechaVencimiento).toLocaleDateString('es-CL', {
      weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
    })
    return `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;font-weight:600;font-family:monospace">${vehiculo.patente}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#374151">${vehiculo.marca || ''} ${vehiculo.modelo || ''}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#374151">${TIPO_LABEL[doc.tipo] || doc.tipo}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#555">${vencStr}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee">
          <span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:12px;font-weight:600;background:${badge.bg};color:${badge.color}">${badge.texto}</span>
        </td>
      </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px">
      <table width="640" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">

        <tr><td style="background:#1C1F26;padding:24px 32px">
          <p style="color:#fff;font-size:20px;font-weight:700;margin:0">${tenant.nombre}</p>
          <p style="color:#9CA3AF;font-size:13px;margin:4px 0 0">Alerta de documentos de flota — ${alertas.length} documento${alertas.length > 1 ? 's' : ''} requieren atención</p>
        </td></tr>

        <tr><td style="padding:24px 32px 8px">
          <p style="margin:0 0 20px;color:#374151;font-size:14px">
            Los siguientes documentos de tu flota se encuentran vencidos o próximos a vencer:
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:6px;overflow:hidden">
            <thead>
              <tr style="background:#f9f9f9">
                <th style="padding:8px 14px;text-align:left;font-size:11px;text-transform:uppercase;color:#6B7280">Patente</th>
                <th style="padding:8px 14px;text-align:left;font-size:11px;text-transform:uppercase;color:#6B7280">Vehículo</th>
                <th style="padding:8px 14px;text-align:left;font-size:11px;text-transform:uppercase;color:#6B7280">Documento</th>
                <th style="padding:8px 14px;text-align:left;font-size:11px;text-transform:uppercase;color:#6B7280">Vencimiento</th>
                <th style="padding:8px 14px;text-align:left;font-size:11px;text-transform:uppercase;color:#6B7280">Estado</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>

          <p style="margin:20px 0 0;color:#6B7280;font-size:12px">
            Ingresa al panel de administración para revisar y actualizar los documentos de tu flota.
          </p>
        </td></tr>

        <tr><td style="background:#f9f9f9;padding:16px 32px;text-align:center">
          <p style="color:#9CA3AF;font-size:11px;margin:0">${tenant.nombre} · Alerta automática de AgendaCar · <a href="https://agendacar.cl" style="color:#9CA3AF">agendacar.cl</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/**
 * Revisa todos los tenants con alertaDocActiva=true y flotaActiva=true,
 * encuentra documentos próximos a vencer o vencidos, y envía correos
 * evitando duplicados via AlertaDocumentoLog.
 */
const checkDocumentosAlerta = async () => {
  try {
    const tenants = await prisma.tenant.findMany({
      where: { activo: true, alertaDocActiva: true, flotaActiva: true }
    })

    if (tenants.length === 0) return { alertas: 0 }

    const resend = getResend()
    let totalAlertas = 0

    for (const tenant of tenants) {
      if (!tenant.email) continue

      // Parsear días configurados (ej: "20,10,5")
      const diasConfig = (tenant.alertaDocDias || '20,10,5')
        .split(',')
        .map(s => parseInt(s.trim(), 10))
        .filter(n => !isNaN(n) && n >= 0)

      if (diasConfig.length === 0) continue

      const maxDias = Math.max(...diasConfig)

      // Obtener documentos con fechaVencimiento en los próximos maxDias días
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      const limite = new Date(hoy)
      limite.setDate(limite.getDate() + maxDias + 1)

      const documentos = await prisma.vehiculoDocumento.findMany({
        where: {
          tenantId: tenant.id,
          fechaVencimiento: { lte: limite }
        },
        include: {
          vehiculo: { select: { patente: true, marca: true, modelo: true } }
        }
      })

      if (documentos.length === 0) continue

      // Logs ya enviados para este tenant (batch para evitar N+1)
      const logsEnviados = await prisma.alertaDocumentoLog.findMany({
        where: { tenantId: tenant.id },
        select: { documentoId: true, diasRestantes: true }
      })
      const enviados = new Set(logsEnviados.map(l => `${l.documentoId}:${l.diasRestantes}`))

      // Para cada documento, ver si corresponde enviar alerta para algún umbral
      const paraEnviar = []

      for (const doc of documentos) {
        const dias = diasHasta(doc.fechaVencimiento)

        if (dias < 0) {
          // Vencido: notificar con umbral 0, solo una vez
          if (!enviados.has(`${doc.id}:0`)) {
            paraEnviar.push({ doc, vehiculo: doc.vehiculo, dias, umbral: 0 })
          }
        } else {
          // Buscar todos los umbrales que ya deberían haberse disparado (dias <= umbral)
          // y que aún no fueron enviados. Notificar el primero pendiente (el más grande).
          const umbralsDiasSorted = [...diasConfig].sort((a, b) => b - a) // desc: 20,10,5
          for (const umbral of umbralsDiasSorted) {
            if (dias <= umbral && !enviados.has(`${doc.id}:${umbral}`)) {
              paraEnviar.push({ doc, vehiculo: doc.vehiculo, dias, umbral })
              break // un umbral por documento por ciclo
            }
          }
        }
      }

      if (paraEnviar.length === 0) continue

      // Enviar email con todas las alertas del tenant
      try {
        await resend.emails.send({
          from: MAIL_FROM,
          to: tenant.email,
          subject: `⚠ Documentos de flota — ${paraEnviar.length} documento${paraEnviar.length > 1 ? 's' : ''} requieren atención · ${tenant.nombre}`,
          html: htmlAlerta({ tenant, alertas: paraEnviar })
        })

        // Registrar en log para evitar duplicados
        for (const { doc, umbral } of paraEnviar) {
          await prisma.alertaDocumentoLog.create({
            data: {
              tenantId: tenant.id,
              documentoId: doc.id,
              diasRestantes: umbral
            }
          }).catch(() => {}) // ignorar si ya existe (race condition)
        }

        totalAlertas += paraEnviar.length
      } catch (err) {
        console.error(`[alertaDoc] Error enviando a ${tenant.email}:`, err?.message)
      }
    }

    return { alertas: totalAlertas }
  } catch (error) {
    console.error('[alertaDoc] checkDocumentosAlerta:', error?.message)
    throw error
  }
}

/**
 * GET /api/flota/configuracion
 * Devuelve configuración de alertas de documentos para el tenant
 */
const getConfiguracion = async (req, res) => {
  const { tenantId } = req.user
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { alertaDocActiva: true, alertaDocDias: true }
    })
    res.json(tenant || { alertaDocActiva: false, alertaDocDias: '20,10,5' })
  } catch (error) {
    res.status(500).json({ error: error?.message })
  }
}

/**
 * PUT /api/flota/configuracion
 * Actualiza configuración de alertas de documentos
 */
const updateConfiguracion = async (req, res) => {
  const { tenantId } = req.user
  const { alertaDocActiva, alertaDocDias } = req.body

  // Validar formato días: "20,10,5"
  if (alertaDocDias !== undefined) {
    const valido = String(alertaDocDias)
      .split(',')
      .every(s => /^\d+$/.test(s.trim()))
    if (!valido) return res.status(400).json({ error: 'alertaDocDias debe ser una lista de números separados por coma' })
  }

  try {
    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(alertaDocActiva !== undefined && { alertaDocActiva: Boolean(alertaDocActiva) }),
        ...(alertaDocDias !== undefined && { alertaDocDias: String(alertaDocDias) })
      },
      select: { alertaDocActiva: true, alertaDocDias: true }
    })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: error?.message })
  }
}

module.exports = { checkDocumentosAlerta, getConfiguracion, updateConfiguracion }
