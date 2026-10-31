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

const imprimirCotizacion = async (reservaId) => {
  try {
    const cot = await getCotizacion(reservaId)
    const tenant = getUsuario()?.tenant
    const ventana = window.open('', '_blank', 'width=800,height=600')
    if (!ventana) return
    const items = (cot.items || []).filter(i => i.descripcion?.trim())
    const subtotal = items.reduce((s, i) => s + (i.cantidad || 1) * (i.valor || 0), 0)
    const iva = cot.incluyeIva ? Math.round(subtotal * 0.19) : 0
    const total = subtotal + iva
    ventana.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Cotización Nº${cot.numero || '—'}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:13px;color:#111}
.header{background:#1C1F26;color:#fff;padding:24px 32px;display:flex;align-items:center;gap:16px}
.header img{height:56px;width:auto;object-fit:contain}
.header-text h1{font-size:18px;font-weight:700}.header-text p{font-size:11px;color:#9CA3AF;margin-top:2px}
.header-num{margin-left:auto;text-align:right}.header-num .num{font-size:22px;font-weight:800;color:#6C8EFF}
.header-num .fecha{font-size:11px;color:#9CA3AF;margin-top:2px}
.body{padding:32px}
table.info{width:100%;border-collapse:collapse;margin-bottom:24px}
table.info td{padding:5px 8px;font-size:12px;border:1px solid #e5e7eb}
table.info td:first-child{background:#f9fafb;font-size:11px;color:#6B7280;font-weight:600;text-transform:uppercase;width:130px}
table.items{width:100%;border-collapse:collapse;margin-bottom:16px}
table.items th{background:#f0f0f0;padding:8px 10px;font-size:11px;text-transform:uppercase;color:#555;text-align:left}
table.items td{padding:8px 10px;border-bottom:1px solid #eee}
table.items td:nth-child(2),table.items td:nth-child(3),table.items td:nth-child(4){text-align:right}
.totals{display:flex;flex-direction:column;align-items:flex-end;gap:4px;margin-bottom:24px}
.totals .row{display:flex;gap:48px;font-size:13px}
.totals .row.final{font-weight:700;font-size:16px;border-top:2px solid #111;padding-top:6px;margin-top:2px}
.totals .lbl{color:#555}.totals .val{min-width:80px;text-align:right}
.footer{font-size:11px;color:#999;margin-top:32px;display:flex;justify-content:space-between}
@media print{body{padding:0}}</style></head><body>
<div class="header">
  ${tenant?.logoUrl ? `<img src="${tenant.logoUrl}" alt="${tenant.nombre}">` : ''}
  <div class="header-text"><h1>${tenant?.nombre || 'Taller'}</h1>${tenant?.rut ? `<p>${tenant.rut}</p>` : ''}${tenant?.direccion ? `<p>${tenant.direccion}</p>` : ''}</div>
  <div class="header-num"><div class="num">COTIZACIÓN Nº${cot.numero || '—'}</div><div class="fecha">${new Date(cot.createdAt || Date.now()).toLocaleDateString('es-CL')}</div></div>
</div>
<div class="body">
<table class="info">
  ${cot.clienteRut ? `<tr><td>RUT Cliente</td><td>${cot.clienteRut}</td></tr>` : ''}
  ${cot.clienteDireccion ? `<tr><td>Dirección</td><td>${cot.clienteDireccion}${cot.clienteComuna ? ', ' + cot.clienteComuna : ''}</td></tr>` : ''}
  <tr><td>Notas</td><td>${cot.notas || '—'}</td></tr>
</table>
${items.length ? `<table class="items"><thead><tr><th>Descripción</th><th>Cant.</th><th>P. Unit.</th><th>Total</th></tr></thead><tbody>
${items.map(i => `<tr><td>${i.descripcion}</td><td>${i.cantidad||1}</td><td>${formatCLP(i.valor)}</td><td>${formatCLP((i.cantidad||1)*(i.valor||0))}</td></tr>`).join('')}
</tbody></table>` : ''}
<div class="totals">
  ${cot.incluyeIva ? `<div class="row"><span class="lbl">Subtotal</span><span class="val">${formatCLP(subtotal)}</span></div>
  <div class="row"><span class="lbl">IVA 19%</span><span class="val">${formatCLP(iva)}</span></div>` : ''}
  <div class="row final"><span class="lbl">Total</span><span class="val">${formatCLP(total)}</span></div>
</div>
<div class="footer"><span>${tenant?.nombre || ''}</span><span>Impreso: ${new Date().toLocaleString('es-CL')}</span></div>
</div>
<script>window.onload=()=>window.print()</script></body></html>`)
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
.footer{margin-top:40px;display:flex;justify-content:space-between;font-size:11px;color:#999}
@media print{body{padding:20px}}</style></head><body>
<div class="header">${tenant?.logoUrl ? `<img src="${tenant.logoUrl}" alt="${tenant.nombre}">` : ''}
<div class="header-text"><h1>${tenant?.nombre || 'Taller'}</h1>
<div class="sub">Resumen de Atención — ${new Date(reserva.fecha).toLocaleDateString('es-CL')}</div></div></div>
<hr>
<div class="grid">
  <div><div class="lbl">Cliente</div><div class="val">${reserva.nombre || '—'}</div></div>
  <div><div class="lbl">Patente</div><div class="val">${reserva.patente || '—'}</div></div>
  <div><div class="lbl">Servicio</div><div class="val">${reserva.servicio || '—'}</div></div>
</div>
${items.length ? `<table><thead><tr><th>Descripción</th><th>Cant.</th><th>P. Unit.</th><th>Total</th></tr></thead><tbody>
${items.map(i=>`<tr><td>${i.descripcion}</td><td>${i.cantidad||1}</td><td>${formatCLP(i.valor)}</td><td>${formatCLP((i.cantidad||1)*(i.valor||0))}</td></tr>`).join('')}
<tr class="total-row"><td colspan="3">Total</td><td>${formatCLP(subtotal)}</td></tr>
</tbody></table>` : '<p style="color:#888;margin-bottom:16px">Sin ítems.</p>'}
${cierre.notas ? `<div class="notas"><strong>Observaciones:</strong> ${cierre.notas}</div>` : ''}
<div class="footer"><span>${tenant?.nombre||''}</span><span>Impreso: ${new Date().toLocaleString('es-CL')}</span></div>
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
                        onClick={() => imprimirCotizacion(r.id)}
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
