import { useEffect, useRef, useState } from 'react'
import { Plus, Printer, Trash2 } from 'lucide-react'
import Button from './ui/Button'
import Dialog from './ui/Dialog'
import { guardarCierre } from '../services/cierreService'
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

export default function ModalCierre({ reserva, open, onClose, onGuardado }) {
  const [items, setItems] = useState([{ _id: nextId(), descripcion: '', valor: 0, _empty: true }])
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  const tenant = getUsuario()?.tenant

  // Reset al abrir
  useEffect(() => {
    if (open) {
      setItems([{ _id: nextId(), descripcion: '', valor: 0, _empty: true }])
      setNotas('')
      setError('')
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

  const handleGuardar = async () => {
    const itemsValidos = items.filter(i => i.descripcion.trim())
    setGuardando(true)
    setError('')
    try {
      await guardarCierre(reserva.id, {
        notas: notas.trim() || null,
        items: itemsValidos.map(({ descripcion, valor }) => ({ descripcion, valor }))
      })
      onGuardado()
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar el cierre.'))
      setGuardando(false)
    }
  }

  const handleImprimir = () => {
    const ventana = window.open('', '_blank', 'width=800,height=600')
    if (!ventana) return

    const fecha = new Date(reserva.fecha)
    const fechaStr = fecha.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const horaStr = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    const itemsValidos = items.filter(i => i.descripcion.trim())
    const nombreTaller = tenant?.nombre || 'Taller'
    const logoUrl = tenant?.logoUrl || ''

    ventana.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Resumen de Atención — ${nombreTaller}</title>
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
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    ${logoUrl ? `<img src="${logoUrl}" alt="${nombreTaller}" />` : ''}
    <div class="header-text">
      <h1>${nombreTaller}</h1>
      <div class="subtitle">Resumen de Atención — ${fechaStr} ${horaStr}</div>
    </div>
  </div>
  <hr class="divider" />

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
    ${reserva.kilometraje ? `<div><div class="label">Kilometraje</div><div class="value">${reserva.kilometraje.toLocaleString('es-CL')} km</div></div>` : ''}
  </div>

  ${itemsValidos.length > 0 ? `
  <table>
    <thead><tr><th>Descripción</th><th style="text-align:right">Valor</th></tr></thead>
    <tbody>
      ${itemsValidos.map(i => `<tr><td>${i.descripcion}</td><td>${formatCLP(i.valor)}</td></tr>`).join('')}
      <tr class="total-row"><td>Total</td><td>${formatCLP(itemsValidos.reduce((s, i) => s + (i.valor || 0), 0))}</td></tr>
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
      title="Cierre de atención"
      size="lg"
      footer={
        <div className="flex justify-between w-full items-center gap-3">
          <Button variant="ghost" leftIcon={Printer} onClick={handleImprimir} disabled={guardando}>
            Imprimir
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={guardando}>Cancelar</Button>
            <Button variant="success" onClick={handleGuardar} loading={guardando}>
              Confirmar atendida
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
            <p className="text-gray-400 text-xs">Resumen de atención</p>
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
            <span className="text-xs text-gray-400 uppercase tracking-wide">Total</span>
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
            placeholder="Ej: Se recomienda revisión de frenos en próxima visita..."
            className="w-full rounded-lg border border-[#2A2D35] bg-[#1C1F26] text-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6C8EFF] resize-none"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>
    </Dialog>
  )
}
