import { useEffect, useRef, useState } from 'react'
import { Mail, MessageCircle, Plus, Printer, Trash2 } from 'lucide-react'
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
      <input
        type="text"
        placeholder="Descripción del trabajo o repuesto"
        value={item.descripcion}
        onChange={e => onChange({ ...item, descripcion: e.target.value })}
        className="flex-1 rounded-lg border border-[#2A2D35] bg-[#1C1F26] text-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6C8EFF]"
      />
      <input
        type="number"
        placeholder="Valor"
        min="0"
        value={item.valor === 0 && item._empty ? '' : item.valor}
        onChange={e => onChange({ ...item, valor: parseFloat(e.target.value) || 0, _empty: !e.target.value })}
        className="w-32 rounded-lg border border-[#2A2D35] bg-[#1C1F26] text-white px-3 py-2 text-sm text-right placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6C8EFF]"
      />
      <button
        onClick={onEliminar}
        className="text-gray-500 hover:text-red-400 transition-colors p-1"
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
  const [items, setItems] = useState([{ _id: nextId(), descripcion: '', valor: 0, _empty: true }])
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [enviandoEmail, setEnviandoEmail] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const inputRef = useRef(null)

  const tenant = getUsuario()?.tenant

  useEffect(() => {
    if (open) {
      setItems([{ _id: nextId(), descripcion: '', valor: 0, _empty: true }])
      setNotas('')
      setError('')
      setExito('')
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [open])

  const agregarFila = () =>
    setItems(prev => [...prev, { _id: nextId(), descripcion: '', valor: 0, _empty: true }])

  const actualizarItem = (id, datos) =>
    setItems(prev => prev.map(i => (i._id === id ? { ...i, ...datos } : i)))

  const eliminarItem = (id) =>
    setItems(prev => prev.filter(i => i._id !== id))

  const total = items.reduce((s, i) => s + (parseFloat(i.valor) || 0), 0)

  const itemsValidos = () => items.filter(i => i.descripcion.trim())

  // Guarda la cotización y llama onGuardado (actualiza agenda)
  const handleGuardar = async () => {
    setGuardando(true)
    setError('')
    setExito('')
    try {
      await guardarCotizacion(reserva.id, {
        notas: notas.trim() || null,
        items: itemsValidos().map(({ descripcion, valor }) => ({ descripcion, valor }))
      })
      onGuardado()
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar la cotización.'))
      setGuardando(false)
    }
  }

  // Guarda y envía por email
  const handleEmail = async () => {
    if (!reserva?.email) {
      setError('El cliente no tiene email registrado.')
      return
    }
    setEnviandoEmail(true)
    setError('')
    setExito('')
    try {
      // Primero guardar
      await guardarCotizacion(reserva.id, {
        notas: notas.trim() || null,
        items: itemsValidos().map(({ descripcion, valor }) => ({ descripcion, valor }))
      })
      // Luego enviar
      await enviarEmailCotizacion(reserva.id)
      setExito(`Cotización enviada a ${reserva.email}`)
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo enviar el email.'))
    } finally {
      setEnviandoEmail(false)
    }
  }

  // WhatsApp: guarda y abre link
  const handleWhatsApp = async () => {
    setGuardando(true)
    setError('')
    setExito('')
    try {
      await guardarCotizacion(reserva.id, {
        notas: notas.trim() || null,
        items: itemsValidos().map(({ descripcion, valor }) => ({ descripcion, valor }))
      })
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar la cotización.'))
      setGuardando(false)
      return
    }
    setGuardando(false)

    const nombreTaller = tenant?.nombre || 'El taller'
    const lineas = itemsValidos().map(i => `• ${i.descripcion}: ${formatCLP(i.valor)}`).join('\n')
    const mensaje = [
      `*Cotización de ${nombreTaller}*`,
      `Cliente: ${reserva.nombre}`,
      `Vehículo: ${[reserva.vehiculo?.marca, reserva.vehiculo?.modelo].filter(Boolean).join(' ') || reserva.patente}`,
      `Patente: ${reserva.patente}`,
      '',
      lineas || '(sin ítems)',
      '',
      `*Total: ${formatCLP(total)}*`,
      notas.trim() ? `\nObservaciones: ${notas.trim()}` : ''
    ].filter(l => l !== undefined).join('\n')

    const tel = (reserva.telefono || '').replace(/\D/g, '')
    const telWA = tel.startsWith('56') ? tel : `56${tel}`
    window.open(`https://wa.me/${telWA}?text=${encodeURIComponent(mensaje)}`, '_blank')
  }

  const handleImprimir = async () => {
    // Guardar antes de imprimir
    try {
      await guardarCotizacion(reserva.id, {
        notas: notas.trim() || null,
        items: itemsValidos().map(({ descripcion, valor }) => ({ descripcion, valor }))
      })
    } catch {
      // Imprimir aunque falle el guardado
    }

    const ventana = window.open('', '_blank', 'width=800,height=600')
    if (!ventana) return

    const fecha = new Date(reserva.fecha)
    const fechaStr = fecha.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const horaStr = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    const nombreTaller = tenant?.nombre || 'Taller'
    const logoUrl = tenant?.logoUrl || ''
    const validos = itemsValidos()

    ventana.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Cotización — ${nombreTaller}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 40px; }
    .header { display: flex; align-items: center; gap: 16px; margin-bottom: 6px; }
    .header img { height: 52px; width: auto; object-fit: contain; }
    .header-text h1 { font-size: 20px; line-height: 1.2; }
    .header-text .subtitle { color: #555; font-size: 12px; margin-top: 2px; }
    .divider { border: none; border-top: 1px solid #ddd; margin: 16px 0 20px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 24px; }
    .label { color: #555; font-size: 11px; text-transform: uppercase; letter-spacing: .5px; }
    .value { font-weight: 600; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #f0f0f0; text-align: left; padding: 8px 10px; font-size: 11px; text-transform: uppercase; color: #555; }
    td { padding: 8px 10px; border-bottom: 1px solid #eee; }
    td:last-child { text-align: right; font-weight: 600; }
    .total-row td { font-size: 15px; font-weight: 700; border-top: 2px solid #111; border-bottom: none; }
    .notas { background: #f9f9f9; border-left: 3px solid #ccc; padding: 10px 14px; margin-bottom: 24px; font-size: 12px; color: #444; }
    .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 11px; color: #999; }
    .badge { display: inline-block; background: #f0f0f0; border: 1px solid #ddd; border-radius: 4px; padding: 3px 8px; font-size: 11px; color: #555; margin-bottom: 16px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    ${logoUrl ? `<img src="${logoUrl}" alt="${nombreTaller}" />` : ''}
    <div class="header-text">
      <h1>${nombreTaller}</h1>
      <div class="subtitle">Cotización / Presupuesto — ${fechaStr} ${horaStr}</div>
    </div>
  </div>
  <hr class="divider" />
  <div class="badge">PRESUPUESTO — sujeto a aprobación del cliente</div>

  <div class="grid">
    <div>
      <div class="label">Cliente</div>
      <div class="value">${reserva.nombre}</div>
    </div>
    <div>
      <div class="label">Teléfono</div>
      <div class="value">${reserva.telefono}</div>
    </div>
    <div>
      <div class="label">Vehículo</div>
      <div class="value">${[reserva.vehiculo?.marca, reserva.vehiculo?.modelo].filter(Boolean).join(' ') || '—'}</div>
    </div>
    <div>
      <div class="label">Patente</div>
      <div class="value">${reserva.patente}</div>
    </div>
    <div>
      <div class="label">Servicio</div>
      <div class="value">${reserva.servicio?.nombre || '—'}</div>
    </div>
  </div>

  ${validos.length > 0 ? `
  <table>
    <thead><tr><th>Descripción</th><th style="text-align:right">Valor</th></tr></thead>
    <tbody>
      ${validos.map(i => `<tr><td>${i.descripcion}</td><td>${formatCLP(i.valor)}</td></tr>`).join('')}
      <tr class="total-row"><td>Total</td><td>${formatCLP(validos.reduce((s, i) => s + (i.valor || 0), 0))}</td></tr>
    </tbody>
  </table>` : '<p style="color:#888;margin-bottom:16px">Sin ítems registrados.</p>'}

  ${notas.trim() ? `<div class="notas"><strong>Observaciones:</strong> ${notas.trim()}</div>` : ''}

  <div class="footer">
    <span>${nombreTaller}</span>
    <span>Impreso: ${new Date().toLocaleString('es-CL')}</span>
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
          {/* Botones de envío */}
          <div className="flex gap-2">
            <Button variant="ghost" leftIcon={Printer} onClick={handleImprimir} disabled={guardando || enviandoEmail} title="Imprimir">
              Imprimir
            </Button>
            <Button
              variant="ghost"
              leftIcon={MessageCircle}
              onClick={handleWhatsApp}
              disabled={guardando || enviandoEmail}
              title="Enviar por WhatsApp"
            >
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
          {/* Guardar */}
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

        {/* Items */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-white">Trabajos y repuestos</h3>
            <span className="text-xs text-gray-400">Valor en $CLP</span>
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

        {/* Total */}
        <div className="flex justify-end">
          <div className="bg-[#22252E] border border-[#2A2D35] rounded-xl px-5 py-3 text-right">
            <span className="text-xs text-gray-400 uppercase tracking-wide">Total estimado</span>
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
