import { useEffect, useState } from 'react'
import { BanknoteIcon, Loader2, MinusCircle, Plus, Trash2, TrendingDown, TrendingUp, X } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { getResumenCaja } from '../../services/cajaService'
import { listarEgresos, crearEgreso, eliminarEgreso } from '../../services/egresosService'
import Button from '../../components/ui/Button'

const formatCLP = (v) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v || 0)

const formatFecha = (iso) =>
  new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })

const formatHora = (iso) =>
  new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })

// ── Tarjeta de estadística ────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color = 'green' }) {
  const colors = {
    green:  'bg-green-50 text-green-600',
    blue:   'bg-blue-50 text-blue-500',
    red:    'bg-red-50 text-red-500',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="bg-surface border border-line rounded-2xl p-5 flex items-start gap-4">
      <div className={`rounded-xl p-3 ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-ink-muted uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-bold text-ink">{value}</p>
        {sub && <p className="text-xs text-ink-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── Modal registrar egreso ────────────────────────────────────────────────────

function ModalEgreso({ onGuardado, onClose }) {
  const hoy = new Date().toISOString().slice(0, 10)
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto]             = useState('')
  const [fecha, setFecha]             = useState(hoy)
  const [guardando, setGuardando]     = useState(false)
  const [error, setError]             = useState('')

  const handleGuardar = async () => {
    if (!descripcion.trim()) return setError('Escribe una descripción.')
    if (!monto || Number(monto) <= 0) return setError('El monto debe ser mayor a 0.')
    setGuardando(true)
    setError('')
    try {
      await crearEgreso({ descripcion: descripcion.trim(), monto: Number(monto), fecha })
      onGuardado()
    } catch {
      setError('No se pudo registrar el egreso.')
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Registrar egreso</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-ink-muted">Descripción</label>
            <input
              type="text"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Ej: Compra de aceite, pago de luz..."
              className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-accent-400"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-ink-muted">Monto ($)</label>
              <input
                type="number"
                min="1"
                value={monto}
                onChange={e => setMonto(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-accent-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-ink-muted">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent-400"
              />
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={guardando}>Cancelar</Button>
          <Button variant="primary" onClick={handleGuardar} loading={guardando}>Guardar</Button>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function Caja() {
  useDocumentTitle('Caja — AgendaCar')
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [egresos, setEgresos]     = useState([])
  const [modalEgreso, setModalEgreso] = useState(false)
  const [eliminando, setEliminando]   = useState(null)

  const cargarTodo = async () => {
    try {
      const [resumen, listaEgresos] = await Promise.all([
        getResumenCaja(),
        listarEgresos()
      ])
      setData(resumen)
      setEgresos(listaEgresos)
    } catch {
      setError('No se pudo cargar el resumen de caja.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarTodo() }, [])

  const handleEliminarEgreso = async (id) => {
    setEliminando(id)
    try {
      await eliminarEgreso(id)
      setEgresos(prev => prev.filter(e => e.id !== id))
    } finally {
      setEliminando(null)
    }
  }

  // Calcular totales del mes actual para egresos
  const ahora = new Date()
  const egresosMes = egresos.filter(e => {
    const f = new Date(e.fecha)
    return f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear()
  })
  const totalEgresosMes = egresosMes.reduce((s, e) => s + e.monto, 0)
  const utilidadMes = (data?.totalMes || 0) - totalEgresosMes

  return (
    <AdminLayout>
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">

        <h1 className="text-xl font-bold text-ink flex items-center gap-2">
          <BanknoteIcon className="h-5 w-5 text-accent-600" />
          Caja
        </h1>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {data && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                icon={BanknoteIcon}
                label="Recaudado hoy"
                value={formatCLP(data.totalHoy)}
                sub={`${data.atencioneHoy} atención${data.atencioneHoy !== 1 ? 'es' : ''}`}
                color="green"
              />
              <StatCard
                icon={TrendingUp}
                label="Ingresos este mes"
                value={formatCLP(data.totalMes)}
                sub={`${data.atencioneMes} atención${data.atencioneMes !== 1 ? 'es' : ''}`}
                color="blue"
              />
              <StatCard
                icon={TrendingDown}
                label="Egresos este mes"
                value={formatCLP(totalEgresosMes)}
                sub={`${egresosMes.length} registro${egresosMes.length !== 1 ? 's' : ''}`}
                color="red"
              />
              <StatCard
                icon={BanknoteIcon}
                label="Utilidad este mes"
                value={formatCLP(utilidadMes)}
                sub="Ingresos − egresos"
                color="purple"
              />
            </div>

            {/* Atenciones recientes */}
            <div className="rounded-xl border border-line bg-surface overflow-hidden">
              <div className="px-4 py-2.5 border-b border-line bg-surface-raised">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Atenciones recientes
                </h2>
              </div>

              {data.recientes.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-ink-muted">
                  Aún no hay atenciones registradas.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-xs text-ink-muted uppercase tracking-wide bg-surface-raised">
                      <th className="text-left px-4 py-3">Fecha</th>
                      <th className="text-left px-4 py-3">Cliente</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">Vehículo</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">Servicio</th>
                      <th className="text-right px-4 py-3">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.recientes.map((c) => (
                      <tr key={c.id} className="hover:bg-graphite-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-ink font-medium">{formatFecha(c.createdAt)}</span>
                          <span className="block text-xs text-ink-muted">{formatHora(c.createdAt)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-ink">{c.reserva?.nombre || '—'}</span>
                          <span className="block text-xs text-ink-muted font-mono">{c.reserva?.patente}</span>
                        </td>
                        <td className="px-4 py-3 text-ink-muted hidden sm:table-cell">
                          {[c.reserva?.vehiculo?.marca, c.reserva?.vehiculo?.modelo].filter(Boolean).join(' ') || '—'}
                        </td>
                        <td className="px-4 py-3 text-ink-muted hidden sm:table-cell">
                          {c.reserva?.servicio?.nombre || '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-ink whitespace-nowrap">
                          {formatCLP(c.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Egresos */}
            <div className="rounded-xl border border-line bg-surface overflow-hidden">
              <div className="px-4 py-2.5 border-b border-line bg-surface-raised flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted flex items-center gap-1.5">
                  <MinusCircle size={13} className="text-red-400" />
                  Egresos
                </h2>
                <button
                  onClick={() => setModalEgreso(true)}
                  className="flex items-center gap-1 text-xs font-medium text-accent-600 hover:text-accent-700 transition-colors"
                >
                  <Plus size={13} /> Registrar gasto
                </button>
              </div>

              {egresos.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-ink-muted">
                  Sin egresos registrados.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-xs text-ink-muted uppercase tracking-wide bg-surface-raised">
                      <th className="text-left px-4 py-3">Fecha</th>
                      <th className="text-left px-4 py-3">Descripción</th>
                      <th className="text-right px-4 py-3">Monto</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {egresos.map(e => (
                      <tr key={e.id} className="hover:bg-graphite-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-ink-muted text-xs">
                          {formatFecha(e.fecha)}
                        </td>
                        <td className="px-4 py-3 text-ink">{e.descripcion}</td>
                        <td className="px-4 py-3 text-right font-bold text-red-600 whitespace-nowrap">
                          −{formatCLP(e.monto)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleEliminarEgreso(e.id)}
                            disabled={eliminando === e.id}
                            className="text-ink-soft hover:text-red-500 transition-colors disabled:opacity-40"
                            title="Eliminar"
                          >
                            {eliminando === e.id
                              ? <Loader2 size={14} className="animate-spin" />
                              : <Trash2 size={14} />
                            }
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      {modalEgreso && (
        <ModalEgreso
          onGuardado={() => { setModalEgreso(false); cargarTodo() }}
          onClose={() => setModalEgreso(false)}
        />
      )}
    </AdminLayout>
  )
}
