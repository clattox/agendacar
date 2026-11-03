import { useEffect, useRef, useState } from 'react'
import {
  Car, ChevronDown, ChevronUp, Clock, Edit2, FileText,
  Mail, Phone, Printer, Search, UserRound, Users, X, Check, Loader2
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { listarClientes, actualizarCliente } from '../../services/clientesService'
import { getCotizacion, enviarEmailCotizacion } from '../../services/cotizacionService'
import { getCierre } from '../../services/cierreService'
import { getUsuario } from '../../lib/auth'

// ── Utilidades ────────────────────────────────────────────────────────────────

const formatFecha = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC'
  })
}

const formatCLP = (v) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v || 0)

const imprimirCotizacion = async (reservaId, reserva = {}) => {
  try {
    const cot = await getCotizacion(reservaId)
    const tenant = getUsuario()?.tenant
    const ventana = window.open('', '_blank', 'width=850,height=700')
    if (!ventana) return

    const items = (cot.items || []).filter(i => i.descripcion?.trim())
    const subtotal = items.reduce((s, i) => s + (i.cantidad || 1) * (i.valor || 0), 0)
    const iva = cot.incluyeIva ? Math.round(subtotal * 0.19) : 0
    const total = subtotal + iva
    const numero = cot.numero || '—'
    const fechaStr = new Date((cot.fechaEmision || cot.createdAt || Date.now()))
      .toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const nombreTaller = tenant?.nombre || 'Taller'
    const logoUrl = tenant?.logoUrl || ''
    const validez = tenant?.cotizacionValidez || 15

    const filas = items.map(i => {
      const linTotal = (i.cantidad || 1) * (i.valor || 0)
      return `<tr>
        <td class="td-c">${i.cantidad || 1}</td>
        <td class="td">${i.descripcion}</td>
        <td class="td-r">${formatCLP(i.valor)}</td>
        <td class="td-r">${formatCLP(linTotal)}</td>
      </tr>`
    }).join('')

    const infoPago = [
      tenant?.rut         ? `<tr><td class="lbl">RUT</td><td>: ${tenant.rut}</td></tr>` : '',
      tenant?.banco       ? `<tr><td class="lbl">BANCO</td><td>: ${tenant.banco}</td></tr>` : '',
      tenant?.tipoCuenta  ? `<tr><td class="lbl">TIPO CUENTA</td><td>: ${tenant.tipoCuenta}</td></tr>` : '',
      tenant?.numeroCuenta ? `<tr><td class="lbl">Nº CUENTA</td><td>: ${tenant.numeroCuenta}</td></tr>` : '',
    ].filter(Boolean).join('')

    const vehiculo = [reserva.vehiculoMarca, reserva.vehiculoModelo].filter(Boolean).join(' ')

    const datosCliente = `
      <tr><td class="lbl">CLIENTE</td><td>: ${reserva.nombre || '—'}</td></tr>
      ${cot.clienteRut ? `<tr><td class="lbl">RUT</td><td>: ${cot.clienteRut}</td></tr>` : ''}
      ${cot.clienteDireccion ? `<tr><td class="lbl">DIRECCIÓN</td><td>: ${cot.clienteDireccion}</td></tr>` : ''}
      ${cot.clienteComuna ? `<tr><td class="lbl">COMUNA</td><td>: ${cot.clienteComuna}</td></tr>` : ''}
      <tr><td class="lbl">PATENTE</td><td>: ${reserva.patente || '—'}</td></tr>
      ${vehiculo ? `<tr><td class="lbl">VEHÍCULO</td><td>: ${vehiculo}</td></tr>` : ''}
    `

    ventana.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Cotización Nº${numero} — ${nombreTaller}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 36px 40px }
    .header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:10px }
    .header-left { display:flex; align-items:center; gap:14px }
    .header-left img { height:56px; width:auto; object-fit:contain }
    .taller-nombre { font-size:18px; font-weight:700; line-height:1.2 }
    .taller-sub { font-size:11px; color:#555; margin-top:2px }
    .titulo { text-align:center; font-size:20px; font-weight:700; letter-spacing:1px; margin:18px 0 4px }
    .fecha-linea { text-align:right; font-size:11px; color:#555; margin-bottom:14px }
    .bloque { border:1px solid #222; margin-bottom:14px }
    .bloque-titulo { background:#222; color:#fff; font-size:11px; font-weight:700; padding:4px 10px; text-transform:uppercase; letter-spacing:.5px }
    .bloque table { width:100%; border-collapse:collapse }
    .lbl { color:#555; font-size:11px; padding:3px 10px; width:90px; white-space:nowrap }
    td { padding:3px 10px; font-size:12px }
    .items-table { width:100%; border-collapse:collapse; margin-bottom:14px }
    .items-table th { background:#222; color:#fff; padding:6px 10px; font-size:11px; text-transform:uppercase; text-align:left }
    .items-table th.r { text-align:right }
    .td-c { padding:7px 10px; border-bottom:1px solid #eee; text-align:center; width:50px }
    .td { padding:7px 10px; border-bottom:1px solid #eee }
    .td-r { padding:7px 10px; border-bottom:1px solid #eee; text-align:right; white-space:nowrap }
    .totales { float:right; width:220px; margin-bottom:16px }
    .totales table { width:100%; border-collapse:collapse }
    .totales td { padding:3px 6px; font-size:12px }
    .totales td.lbl-t { color:#555; font-size:11px }
    .totales td.val { text-align:right; font-weight:600 }
    .total-final td { font-size:14px; font-weight:700; border-top:2px solid #111; padding-top:6px }
    .clear { clear:both }
    .pago { margin-bottom:14px }
    .terminos { font-size:11px; color:#555; margin-top:6px; padding-top:10px; border-top:1px solid #eee }
    .terminos strong { text-transform:uppercase; font-size:11px }
    @media print { body { padding:20px 24px } @page { margin:1cm } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      ${logoUrl ? `<img src="${logoUrl}" alt="${nombreTaller}" />` : ''}
      <div>
        <div class="taller-nombre">${nombreTaller.toUpperCase()}</div>
        ${tenant?.rut ? `<div class="taller-sub">${tenant.rut}</div>` : ''}
        ${tenant?.direccion ? `<div class="taller-sub">${tenant.direccion}</div>` : ''}
      </div>
    </div>
  </div>

  <div class="titulo">COTIZACIÓN Nº${numero}</div>
  <div class="fecha-linea">FECHA ${fechaStr}</div>

  <div class="bloque">
    <div class="bloque-titulo">Datos cliente</div>
    <table>${datosCliente}</table>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th style="width:50px;text-align:center">CANT.</th>
        <th>MARCA/DESCRIPCIÓN</th>
        <th class="r">PRECIO UNITARIO</th>
        <th class="r">PRECIO TOTAL</th>
      </tr>
    </thead>
    <tbody>
      ${filas || '<tr><td colspan="4" style="padding:10px;color:#888;text-align:center">Sin ítems</td></tr>'}
    </tbody>
  </table>

  <div class="totales">
    <table>
      ${cot.incluyeIva ? `
      <tr><td class="lbl-t">Valor Venta</td><td class="val">${formatCLP(subtotal)}</td></tr>
      <tr><td class="lbl-t">19% I.V.A</td><td class="val">${formatCLP(iva)}</td></tr>
      ` : ''}
      <tr class="total-final"><td>TOTAL${cot.incluyeIva ? ' C/IVA' : ''}</td><td class="val">${formatCLP(total)}</td></tr>
    </table>
  </div>
  <div class="clear"></div>

  ${cot.notas ? `<p style="border-left:3px solid #ccc;padding:6px 12px;margin-bottom:14px;font-size:11px;color:#444"><strong>Observaciones:</strong> ${cot.notas}</p>` : ''}

  ${cot.linkEvidencia ? `<div style="border-left:3px solid #1D6BE8;background:#EBF1FD;padding:6px 12px;margin-bottom:14px"><p style="font-size:11px;color:#1A3A6B;margin:0 0 3px">📷 <strong>Fotos del vehículo:</strong> <a href="${cot.linkEvidencia}" style="color:#1D6BE8;word-break:break-all">${cot.linkEvidencia}</a></p><p style="font-size:10px;color:#5577AA;margin:0;font-style:italic">Las imágenes estarán disponibles por 3 meses desde la fecha de emisión de esta cotización.</p></div>` : ''}

  ${infoPago ? `
  <div class="pago bloque">
    <div class="bloque-titulo">Información de pago</div>
    <table>
      <tr><td class="lbl">NOMBRE</td><td>: ${nombreTaller}</td></tr>
      ${infoPago}
    </table>
  </div>` : ''}

  <div class="terminos">
    <strong>Términos y condiciones:</strong><br>
    COTIZACIÓN VÁLIDA POR ${validez} DÍAS CORRIDOS DESDE LA FECHA DE EMISIÓN<br>
    <span style="font-style:italic;color:#777">Este documento es una cotización y no reemplaza una boleta o factura.</span>
  </div>

  <script>window.onload = () => { window.print() }</script>
</body>
</html>`)
    ventana.document.close()
  } catch { alert('No se pudo cargar la cotización.') }
}

const imprimirCierre = async (reserva) => {
  try {
    const cierre = await getCierre(reserva.id)
    const tenant = getUsuario()?.tenant
    const ventana = window.open('', '_blank', 'width=800,height=600')
    if (!ventana) return
    const items = (cierre.items || []).filter(i => i.descripcion?.trim())
    const subtotal = items.reduce((s, i) => s + (i.cantidad || 1) * (i.valor || 0), 0)
    const iva = cierre.incluyeIva ? Math.round(subtotal * 0.19) : 0
    const total = subtotal + iva
    ventana.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Cierre de Atención</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:13px;color:#111;padding:40px}
.header{display:flex;align-items:center;gap:16px;margin-bottom:6px}
.header img{height:52px;width:auto;object-fit:contain}
.header-text h1{font-size:20px}.header-text .sub{color:#555;font-size:12px;margin-top:2px}
hr{border:none;border-top:1px solid #ddd;margin:16px 0 20px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;margin-bottom:24px}
.lbl{color:#555;font-size:11px;text-transform:uppercase;letter-spacing:.5px}
.val{font-weight:600;font-size:13px}
table{width:100%;border-collapse:collapse;margin-bottom:16px}
th{background:#f0f0f0;text-align:left;padding:8px 10px;font-size:11px;text-transform:uppercase;color:#555}
td{padding:8px 10px;border-bottom:1px solid #eee}
td:not(:first-child){text-align:right;font-weight:600}
.total-row td{font-size:15px;font-weight:700;border-top:2px solid #111;border-bottom:none}
.notas{background:#f9f9f9;border-left:3px solid #ccc;padding:10px 14px;margin-bottom:24px;font-size:12px;color:#444}
.footer{margin-top:40px;font-size:11px;color:#999}
.footer-disclaimer{text-align:center;margin-bottom:8px;font-style:italic;color:#aaa}
.footer-meta{display:flex;justify-content:space-between}
@media print{body{padding:20px}}</style></head><body>
<div class="header">${tenant?.logoUrl ? `<img src="${tenant.logoUrl}" alt="${tenant.nombre}">` : ''}
<div class="header-text"><h1>${tenant?.nombre || 'Taller'}</h1>
<div class="sub">Resumen de Atención — ${new Date(reserva.fecha).toLocaleDateString('es-CL')}</div></div></div>
<hr>
<div class="grid">
  <div><div class="lbl">Cliente</div><div class="val">${reserva.nombre || '—'}</div></div>
  <div><div class="lbl">Teléfono</div><div class="val">${reserva.telefono || '—'}</div></div>
  ${(reserva.vehiculoMarca || reserva.vehiculoModelo) ? `<div><div class="lbl">Vehículo</div><div class="val">${[reserva.vehiculoMarca, reserva.vehiculoModelo].filter(Boolean).join(' ')}</div></div>` : ''}
  <div><div class="lbl">Patente</div><div class="val">${reserva.patente || '—'}</div></div>
  <div><div class="lbl">Servicio</div><div class="val">${reserva.servicio || '—'}</div></div>
  ${reserva.kilometraje ? `<div><div class="lbl">Kilometraje</div><div class="val">${reserva.kilometraje.toLocaleString('es-CL')} km</div></div>` : ''}
</div>
${items.length ? `<table><thead><tr><th>Descripción</th><th>Cant.</th><th>P. Unit.</th><th>Total</th></tr></thead><tbody>
${items.map(i=>`<tr><td>${i.descripcion}</td><td>${i.cantidad||1}</td><td>${formatCLP(i.valor)}</td><td>${formatCLP((i.cantidad||1)*(i.valor||0))}</td></tr>`).join('')}
${cierre.incluyeIva ? `<tr><td colspan="3" style="text-align:right;color:#555;font-size:12px">Subtotal</td><td>${formatCLP(subtotal)}</td></tr><tr><td colspan="3" style="text-align:right;color:#555;font-size:12px">IVA 19%</td><td>${formatCLP(iva)}</td></tr>` : ''}
<tr class="total-row"><td colspan="3">Total</td><td>${formatCLP(total)}</td></tr>
</tbody></table>` : '<p style="color:#888;margin-bottom:16px">Sin ítems.</p>'}
${cierre.notas ? `<div class="notas"><strong>Observaciones:</strong> ${cierre.notas}</div>` : ''}
<div class="footer"><div class="footer-disclaimer">Este documento es solo un resumen de atención y no reemplaza una boleta o factura.</div><div class="footer-meta"><span>${tenant?.nombre||''}</span><span>Impreso: ${new Date().toLocaleString('es-CL')}</span></div></div>
<script>window.onload=()=>window.print()</script></body></html>`)
    ventana.document.close()
  } catch { alert('No se pudo cargar el cierre de atención.') }
}

const ESTADO_BADGE = {
  confirmada:    'bg-blue-50 text-blue-600 border border-blue-200',
  inspeccionada: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  atendida:      'bg-green-50 text-green-700 border border-green-200',
  cancelada:     'bg-red-50 text-red-600 border border-red-200',
}

// ── Tarjeta de cliente ────────────────────────────────────────────────────────

function TarjetaCliente({ cliente, onActualizado }) {
  const [expandido, setExpandido] = useState(false)
  const [editando, setEditando]   = useState(false)
  const [nombre, setNombre]       = useState(cliente.nombre)
  const [email, setEmail]         = useState(cliente.email || '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError]         = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (editando) setTimeout(() => inputRef.current?.focus(), 60)
  }, [editando])

  const handleGuardar = async () => {
    if (!nombre.trim()) return
    setGuardando(true); setError('')
    try {
      await actualizarCliente(cliente.telefono, { nombre: nombre.trim(), email: email.trim() || null })
      onActualizado()
      setEditando(false)
    } catch {
      setError('No se pudo guardar.')
    } finally {
      setGuardando(false)
    }
  }

  const handleCancelar = () => {
    setNombre(cliente.nombre)
    setEmail(cliente.email || '')
    setError('')
    setEditando(false)
  }

  return (
    <li className="divide-y divide-line">
      {/* Fila principal */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Avatar */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-600 font-bold text-sm select-none">
          {cliente.nombre?.[0]?.toUpperCase() || '?'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {editando ? (
            <div className="space-y-1.5">
              <input
                ref={inputRef}
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Nombre del cliente"
                className="w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent-400"
              />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email (opcional)"
                className="w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent-400"
              />
              {error && <p className="text-xs text-danger-600">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleGuardar}
                  disabled={guardando || !nombre.trim()}
                  className="flex items-center gap-1 rounded-lg bg-accent-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-700 disabled:opacity-50 transition-colors"
                >
                  <Check size={12} /> {guardando ? 'Guardando…' : 'Guardar'}
                </button>
                <button
                  onClick={handleCancelar}
                  className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs text-ink-muted hover:text-ink transition-colors"
                >
                  <X size={12} /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-ink text-sm">{cliente.nombre}</span>
                <button
                  onClick={() => setEditando(true)}
                  className="text-ink-soft hover:text-accent-600 transition-colors"
                  title="Editar datos"
                >
                  <Edit2 size={12} />
                </button>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-ink-muted">
                <span className="flex items-center gap-1"><Phone size={10} /> {cliente.telefono}</span>
                {cliente.email && <span className="flex items-center gap-1"><Mail size={10} /> {cliente.email}</span>}
              </div>
              {/* Vehículos */}
              {cliente.vehiculos.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {cliente.vehiculos.map((v, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1 rounded-full border border-line bg-graphite-50 px-2.5 py-0.5 text-[11px] text-ink-muted"
                    >
                      <Car size={10} className="text-ink-soft" />
                      <span className="font-mono font-semibold text-ink">{v.patente}</span>
                      {(v.marca || v.modelo) && <span>{[v.marca, v.modelo].filter(Boolean).join(' ')}</span>}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-6 shrink-0 text-right">
          <div>
            <p className="text-[11px] text-ink-muted">Última visita</p>
            <p className="text-xs font-medium text-ink">{formatFecha(cliente.ultimaVisita)}</p>
          </div>
          <div>
            <p className="text-[11px] text-ink-muted">Visitas</p>
            <p className="text-sm font-bold text-ink">{cliente.totalVisitas}</p>
          </div>
        </div>

        {/* Expand */}
        <button
          onClick={() => setExpandido(v => !v)}
          className="p-1.5 text-ink-soft hover:text-ink transition-colors rounded-md hover:bg-graphite-50"
        >
          {expandido ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* Historial expandible */}
      {expandido && (
        <div className="bg-surface-raised px-4 py-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            Historial de reservas
          </p>
          <ul className="space-y-1.5">
            {cliente.reservas.map(r => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-3 text-ink-muted">
                  <Clock size={11} className="shrink-0" />
                  <span>{formatFecha(r.fecha)}</span>
                  <span className="font-mono font-semibold text-ink">{r.patente}</span>
                  <span className="text-ink">{r.servicio}</span>
                </div>
                <div className="flex items-center gap-2">
                  {r.tieneCotizacion && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => imprimirCotizacion(r.id, r)}
                        className="flex items-center gap-1 rounded px-1.5 py-1 text-[10px] text-accent-600 hover:bg-accent-50 transition-colors"
                        title={`Reimprimir cotización${r.numeroCotizacion ? ' Nº' + r.numeroCotizacion : ''}`}
                      >
                        <FileText size={11} />
                        Cotiz.{r.numeroCotizacion ? ` #${r.numeroCotizacion}` : ''}
                      </button>
                      <button
                        onClick={() => enviarEmailCotizacion(r.id).then(() => alert('Email enviado')).catch(() => alert('No se pudo enviar el email'))}
                        className="rounded p-1 text-ink-muted hover:text-accent-600 hover:bg-accent-50 transition-colors"
                        title="Reenviar cotización por email"
                      >
                        <Mail size={11} />
                      </button>
                    </div>
                  )}
                  {r.tieneCierre && (
                    <button
                      onClick={() => imprimirCierre(r)}
                      className="flex items-center gap-1 rounded px-1.5 py-1 text-[10px] text-green-700 hover:bg-green-50 transition-colors"
                      title="Reimprimir cierre de atención"
                    >
                      <Printer size={11} />
                      Cierre
                    </button>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ESTADO_BADGE[r.estado] || 'bg-graphite-100 text-ink-muted'}`}>
                    {r.estado}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [query, setQuery]       = useState('')
  const timerRef = useRef(null)

  const cargar = async (q = query) => {
    setCargando(true)
    try {
      const data = await listarClientes(q)
      setClientes(data)
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar('') }, []) // eslint-disable-line

  const handleBusqueda = (val) => {
    setBusqueda(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { setQuery(val); cargar(val) }, 350)
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-ink flex items-center gap-2">
              <UserRound className="h-5 w-5 text-accent-600" aria-hidden="true" />
              Clientes
            </h1>
            <p className="text-sm text-ink-muted mt-0.5">
              {cargando ? 'Cargando…' : `${clientes.length} cliente${clientes.length !== 1 ? 's' : ''} registrado${clientes.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Buscador */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none" />
            <input
              type="text"
              placeholder="Nombre, teléfono, patente…"
              value={busqueda}
              onChange={e => handleBusqueda(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface pl-8 pr-8 py-2 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-accent-400"
            />
            {busqueda && (
              <button onClick={() => handleBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Contenido */}
        {cargando ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
          </div>
        ) : clientes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-surface p-10 text-center space-y-2">
            <Users className="h-8 w-8 text-ink-soft mx-auto" />
            <p className="text-sm text-ink-muted">
              {busqueda ? 'Sin resultados para esa búsqueda' : 'Aún no hay clientes registrados'}
            </p>
            <p className="text-xs text-ink-soft">
              {busqueda ? 'Intenta con otro nombre o patente' : 'Los clientes aparecen automáticamente al hacer su primera reserva'}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-line bg-surface overflow-hidden">
            <div className="px-4 py-2.5 border-b border-line bg-surface-raised">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Clientes ({clientes.length})
              </h2>
            </div>
            <ul className="divide-y divide-line">
              {clientes.map(c => (
                <TarjetaCliente
                  key={c.telefono}
                  cliente={c}
                  onActualizado={() => cargar(query)}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
