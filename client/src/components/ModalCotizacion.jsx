import { useEffect, useRef, useState } from 'react'
import { Mail, MessageCircle, Minus, Plus, Printer, Trash2 } from 'lucide-react'
import Button from './ui/Button'
import Dialog from './ui/Dialog'
import { guardarCotizacion, enviarEmailCotizacion } from '../services/cotizacionService'
import { getApiErrorMessage } from '../lib/errors'
import { getUsuario } from '../lib/auth'

// ── Utilidades ────────────────────────────────────────────────────────────────

const formatCLP = (v) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v || 0)

// ── Fila de ítem editable ─────────────────────────────────────────────────────

function FilaItem({ item, onChange, onEliminar }) {
  return (
    <div className="flex gap-2 items-center">
      {/* Cantidad */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onChange({ ...item, cantidad: Math.max(1, (item.cantidad || 1) - 1) })}
          className="flex h-7 w-7 items-center justify-center rounded border border-[#2A2D35] bg-[#1C1F26] text-gray-400 hover:text-white"
        >
          <Minus size={12} />
        </button>
        <input
          type="number"
          min="1"
          value={item.cantidad || 1}
          onChange={e => onChange({ ...item, cantidad: parseInt(e.target.value) || 1 })}
          className="w-10 rounded border border-[#2A2D35] bg-[#1C1F26] text-white px-1 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-[#6C8EFF]"
        />
        <button
          type="button"
          onClick={() => onChange({ ...item, cantidad: (item.cantidad || 1) + 1 })}
          className="flex h-7 w-7 items-center justify-center rounded border border-[#2A2D35] bg-[#1C1F26] text-gray-400 hover:text-white"
        >
          <Plus size={12} />
        </button>
      </div>

      {/* Descripción */}
      <input
        type="text"
        placeholder="Descripción del trabajo o repuesto"
        value={item.descripcion}
        onChange={e => onChange({ ...item, descripcion: e.target.value })}
        className="flex-1 rounded-lg border border-[#2A2D35] bg-[#1C1F26] text-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6C8EFF]"
      />

      {/* Precio unitario */}
      <input
        type="number"
        placeholder="Precio unit."
        min="0"
        value={item.valor === 0 && item._empty ? '' : item.valor}
        onChange={e => onChange({ ...item, valor: parseFloat(e.target.value) || 0, _empty: !e.target.value })}
        className="w-28 rounded-lg border border-[#2A2D35] bg-[#1C1F26] text-white px-3 py-2 text-sm text-right placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6C8EFF]"
      />

      {/* Total fila (solo lectura) */}
      <span className="w-24 shrink-0 text-right text-sm font-semibold text-gray-300">
        {formatCLP((item.cantidad || 1) * (item.valor || 0))}
      </span>

      <button
        onClick={onEliminar}
        className="text-gray-500 hover:text-red-400 transition-colors p-1 shrink-0"
        title="Eliminar fila"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}

// ── Modal principal ───────────────────────────────────────────────────────────

let _itemId = 0
const nextId = () => ++_itemId

export default function ModalCotizacion({ reserva, open, onClose, onGuardado }) {
  const [items, setItems] = useState([{ _id: nextId(), descripcion: '', cantidad: 1, valor: 0, _empty: true }])
  const [notas, setNotas] = useState('')
  const [incluyeIva, setIncluyeIva] = useState(false)
  const [clienteRut, setClienteRut] = useState('')
  const [clienteDireccion, setClienteDireccion] = useState('')
  const [clienteComuna, setClienteComuna] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [enviandoEmail, setEnviandoEmail] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const inputRef = useRef(null)

  const tenant = getUsuario()?.tenant

  useEffect(() => {
    if (open) {
      setItems([{ _id: nextId(), descripcion: '', cantidad: 1, valor: 0, _empty: true }])
      setNotas('')
      setIncluyeIva(false)
      setClienteRut('')
      setClienteDireccion('')
      setClienteComuna('')
      setError('')
      setExito('')
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [open])

  const agregarFila = () =>
    setItems(prev => [...prev, { _id: nextId(), descripcion: '', cantidad: 1, valor: 0, _empty: true }])

  const actualizarItem = (id, datos) =>
    setItems(prev => prev.map(i => (i._id === id ? { ...i, ...datos } : i)))

  const eliminarItem = (id) =>
    setItems(prev => prev.filter(i => i._id !== id))

  const itemsValidos = () => items.filter(i => i.descripcion.trim())

  const subtotal = itemsValidos().reduce((s, i) => s + (i.cantidad || 1) * (parseFloat(i.valor) || 0), 0)
  const iva = incluyeIva ? Math.round(subtotal * 0.19) : 0
  const total = subtotal + iva

  const buildPayload = () => ({
    notas: notas.trim() || null,
    incluyeIva,
    clienteRut: clienteRut.trim() || null,
    clienteDireccion: clienteDireccion.trim() || null,
    clienteComuna: clienteComuna.trim() || null,
    items: itemsValidos().map(({ descripcion, cantidad, valor }) => ({ descripcion, cantidad: cantidad || 1, valor }))
  })

  const handleGuardar = async () => {
    setGuardando(true); setError(''); setExito('')
    try {
      await guardarCotizacion(reserva.id, buildPayload())
      onGuardado()
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar la cotización.'))
      setGuardando(false)
    }
  }

  const handleEmail = async () => {
    if (!reserva?.email) { setError('El cliente no tiene email registrado.'); return }
    setEnviandoEmail(true); setError(''); setExito('')
    try {
      await guardarCotizacion(reserva.id, buildPayload())
      await enviarEmailCotizacion(reserva.id)
      setExito(`Cotización enviada a ${reserva.email}`)
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo enviar el email.'))
    } finally {
      setEnviandoEmail(false)
    }
  }

  const handleWhatsApp = async () => {
    setGuardando(true); setError(''); setExito('')
    try {
      await guardarCotizacion(reserva.id, buildPayload())
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar la cotización.'))
      setGuardando(false); return
    }
    setGuardando(false)

    const nombreTaller = tenant?.nombre || 'El taller'
    const validos = itemsValidos()
    const lineas = validos.map(i => {
      const tot = (i.cantidad || 1) * (i.valor || 0)
      return i.cantidad > 1
        ? `• ${i.cantidad}x ${i.descripcion}: ${formatCLP(tot)}`
        : `• ${i.descripcion}: ${formatCLP(tot)}`
    }).join('\n')

    const mensaje = [
      `*Cotización de ${nombreTaller}*`,
      `Cliente: ${reserva.nombre}`,
      `Vehículo: ${[reserva.vehiculo?.marca, reserva.vehiculo?.modelo].filter(Boolean).join(' ') || reserva.patente}`,
      `Patente: ${reserva.patente}`,
      '',
      lineas || '(sin ítems)',
      '',
      incluyeIva ? `Subtotal: ${formatCLP(subtotal)}\nIVA (19%): ${formatCLP(iva)}\n*Total: ${formatCLP(total)}*` : `*Total: ${formatCLP(total)}*`,
      notas.trim() ? `\nObservaciones: ${notas.trim()}` : ''
    ].filter(l => l !== undefined).join('\n')

    const tel = (reserva.telefono || '').replace(/\D/g, '')
    const telWA = tel.startsWith('56') ? tel : `56${tel}`
    window.open(`https://wa.me/${telWA}?text=${encodeURIComponent(mensaje)}`, '_blank')
  }

  const handleImprimir = async () => {
    let cotizacionGuardada = null
    try {
      cotizacionGuardada = await guardarCotizacion(reserva.id, buildPayload())
    } catch { /* imprimir aunque falle el guardado */ }

    const ventana = window.open('', '_blank', 'width=850,height=700')
    if (!ventana) return

    const numero = cotizacionGuardada?.numero || '—'
    const fecha = new Date()
    const fechaStr = fecha.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const validez = tenant?.cotizacionValidez || 15
    const nombreTaller = tenant?.nombre || 'Taller'
    const logoUrl = tenant?.logoUrl || ''
    const validos = itemsValidos()

    const filas = validos.map(i => {
      const linTotal = (i.cantidad || 1) * (i.valor || 0)
      return `<tr>
        <td class="td-c">${i.cantidad || 1}</td>
        <td class="td">${i.descripcion}</td>
        <td class="td-r">${formatCLP(i.valor)}</td>
        <td class="td-r">${formatCLP(linTotal)}</td>
      </tr>`
    }).join('')

    const infoPago = [
      tenant?.rut        ? `<tr><td class="lbl">RUT</td><td>: ${tenant.rut}</td></tr>` : '',
      tenant?.banco      ? `<tr><td class="lbl">BANCO</td><td>: ${tenant.banco}</td></tr>` : '',
      tenant?.tipoCuenta ? `<tr><td class="lbl">TIPO CUENTA</td><td>: ${tenant.tipoCuenta}</td></tr>` : '',
      tenant?.numeroCuenta ? `<tr><td class="lbl">Nº CUENTA</td><td>: ${tenant.numeroCuenta}</td></tr>` : '',
    ].filter(Boolean).join('')

    const datosCliente = `
      <tr><td class="lbl">CLIENTE</td><td>: ${reserva.nombre}</td></tr>
      ${clienteRut ? `<tr><td class="lbl">RUT</td><td>: ${clienteRut}</td></tr>` : ''}
      ${clienteDireccion ? `<tr><td class="lbl">DIRECCIÓN</td><td>: ${clienteDireccion}</td></tr>` : ''}
      ${clienteComuna ? `<tr><td class="lbl">COMUNA</td><td>: ${clienteComuna}</td></tr>` : ''}
      <tr><td class="lbl">PATENTE</td><td>: ${reserva.patente}</td></tr>
      ${reserva.vehiculo ? `<tr><td class="lbl">VEHÍCULO</td><td>: ${[reserva.vehiculo?.marca, reserva.vehiculo?.modelo].filter(Boolean).join(' ')}</td></tr>` : ''}
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
    .terminos { font-size:11px; color:#555; margin-top:6px }
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
      ${incluyeIva ? `
      <tr><td class="lbl-t">Valor Venta</td><td class="val">${formatCLP(subtotal)}</td></tr>
      <tr><td class="lbl-t">19% I.V.A</td><td class="val">${formatCLP(iva)}</td></tr>
      ` : ''}
      <tr class="total-final"><td>TOTAL${incluyeIva ? ' C/IVA' : ''}</td><td class="val">${formatCLP(total)}</td></tr>
    </table>
  </div>
  <div class="clear"></div>

  ${notas.trim() ? `<p style="border-left:3px solid #ccc;padding:6px 12px;margin-bottom:14px;font-size:11px;color:#444"><strong>Observaciones:</strong> ${notas.trim()}</p>` : ''}

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
    COTIZACIÓN VÁLIDA POR ${validez} DÍAS CORRIDOS DESDE LA FECHA DE EMISIÓN
  </div>

  <script>window.onload = () => { window.print() }</script>
</body>
</html>`)
    ventana.document.close()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Cotización / Presupuesto"
      size="lg"
      footer={
        <div className="flex justify-between w-full items-center gap-2 flex-wrap">
          <div className="flex gap-2">
            <Button variant="ghost" leftIcon={Printer} onClick={handleImprimir} disabled={guardando || enviandoEmail}>
              Imprimir PDF
            </Button>
            <Button variant="ghost" leftIcon={MessageCircle} onClick={handleWhatsApp} disabled={guardando || enviandoEmail}>
              WhatsApp
            </Button>
            <Button
              variant="ghost"
              leftIcon={Mail}
              onClick={handleEmail}
              loading={enviandoEmail}
              disabled={guardando || !reserva?.email}
              title={reserva?.email ? `Enviar a ${reserva.email}` : 'Sin email registrado'}
            >
              Email
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={guardando || enviandoEmail}>Cancelar</Button>
            <Button variant="primary" onClick={handleGuardar} loading={guardando} disabled={enviandoEmail}>
              Guardar cotización
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">

        {/* Cabecera del taller */}
        <div className="flex items-center gap-3 pb-4 border-b border-[#2A2D35]">
          {tenant?.logoUrl && (
            <img src={tenant.logoUrl} alt={tenant.nombre} className="h-10 w-auto object-contain rounded" />
          )}
          <div>
            <p className="text-white font-semibold text-base">{tenant?.nombre || 'Taller'}</p>
            <p className="text-gray-400 text-xs">Cotización / Presupuesto</p>
          </div>
        </div>

        {/* Info del vehículo */}
        <div className="bg-[#22252E] border border-[#2A2D35] rounded-xl p-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <span className="text-gray-400 text-xs uppercase tracking-wide">Cliente</span>
            <p className="text-white font-medium">{reserva?.nombre}</p>
          </div>
          <div>
            <span className="text-gray-400 text-xs uppercase tracking-wide">Patente</span>
            <p className="text-white font-medium">{reserva?.patente}</p>
          </div>
          <div>
            <span className="text-gray-400 text-xs uppercase tracking-wide">Vehículo</span>
            <p className="text-white font-medium">
              {[reserva?.vehiculo?.marca, reserva?.vehiculo?.modelo].filter(Boolean).join(' ') || '—'}
            </p>
          </div>
          <div>
            <span className="text-gray-400 text-xs uppercase tracking-wide">Servicio</span>
            <p className="text-white font-medium">{reserva?.servicio?.nombre || '—'}</p>
          </div>
        </div>

        {/* Datos empresa (opcionales) */}
        <details className="group">
          <summary className="cursor-pointer text-xs text-[#6C8EFF] hover:text-[#8BA3FF] select-none list-none flex items-center gap-1">
            <Plus size={13} className="group-open:rotate-45 transition-transform" />
            Agregar datos de empresa (RUT, dirección, comuna)
          </summary>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="RUT cliente"
              value={clienteRut}
              onChange={e => setClienteRut(e.target.value)}
              className="rounded-lg border border-[#2A2D35] bg-[#1C1F26] text-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6C8EFF]"
            />
            <input
              type="text"
              placeholder="Dirección"
              value={clienteDireccion}
              onChange={e => setClienteDireccion(e.target.value)}
              className="rounded-lg border border-[#2A2D35] bg-[#1C1F26] text-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6C8EFF]"
            />
            <input
              type="text"
              placeholder="Comuna"
              value={clienteComuna}
              onChange={e => setClienteComuna(e.target.value)}
              className="rounded-lg border border-[#2A2D35] bg-[#1C1F26] text-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6C8EFF]"
            />
          </div>
        </details>

        {/* Cabecera tabla */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-white">Trabajos y repuestos</h3>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">Cant. · Descripción · Precio unit. · Total</span>
            </div>
          </div>

          <div className="space-y-2" ref={inputRef}>
            {items.map((item) => (
              <FilaItem
                key={item._id}
                item={item}
                onChange={datos => actualizarItem(item._id, datos)}
                onEliminar={() => eliminarItem(item._id)}
              />
            ))}
          </div>
          <button
            onClick={agregarFila}
            className="mt-3 flex items-center gap-1.5 text-sm text-[#6C8EFF] hover:text-[#8BA3FF] transition-colors"
          >
            <Plus size={15} /> Agregar ítem
          </button>
        </div>

        {/* Totales + IVA */}
        <div className="flex flex-col items-end gap-1">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-400 mb-1 select-none">
            <input
              type="checkbox"
              checked={incluyeIva}
              onChange={e => setIncluyeIva(e.target.checked)}
              className="rounded border-[#2A2D35] bg-[#1C1F26] accent-[#6C8EFF]"
            />
            Incluir IVA 19%
          </label>
          {incluyeIva && (
            <>
              <div className="flex gap-6 text-sm text-gray-400">
                <span>Subtotal</span>
                <span className="font-semibold text-white w-28 text-right">{formatCLP(subtotal)}</span>
              </div>
              <div className="flex gap-6 text-sm text-gray-400">
                <span>IVA (19%)</span>
                <span className="font-semibold text-white w-28 text-right">{formatCLP(iva)}</span>
              </div>
            </>
          )}
          <div className="bg-[#22252E] border border-[#2A2D35] rounded-xl px-5 py-3 text-right mt-1">
            <span className="text-xs text-gray-400 uppercase tracking-wide">Total{incluyeIva ? ' c/IVA' : ''}</span>
            <p className="text-2xl font-bold text-white">{formatCLP(total)}</p>
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Observaciones (opcional)</label>
          <textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            rows={2}
            placeholder="Ej: Precio sujeto a disponibilidad de repuestos..."
            className="w-full rounded-lg border border-[#2A2D35] bg-[#1C1F26] text-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6C8EFF] resize-none"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {exito && <p className="text-green-400 text-sm">{exito}</p>}
      </div>
    </Dialog>
  )
}
