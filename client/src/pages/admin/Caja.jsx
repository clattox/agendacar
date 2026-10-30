import { useEffect, useState } from 'react'
import { BanknoteIcon, Loader2, TrendingUp } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { getResumenCaja } from '../../services/cajaService'

const formatCLP = (v) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v || 0)

const formatFecha = (iso) =>
  new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })

const formatHora = (iso) =>
  new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })

// ── Tarjeta de estadística ────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color = 'green' }) {
  const colors = {
    green: 'bg-green-50 text-green-600',
    blue:  'bg-blue-50 text-blue-500',
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

// ── Página principal ──────────────────────────────────────────────────────────

export default function Caja() {
  useDocumentTitle('Caja — AgendaCar')
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    getResumenCaja()
      .then(setData)
      .catch(() => setError('No se pudo cargar el resumen de caja.'))
      .finally(() => setLoading(false))
  }, [])

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

        {error && <p className="text-danger-600 text-sm">{error}</p>}

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
                label="Recaudado este mes"
                value={formatCLP(data.totalMes)}
                sub={`${data.atencioneMes} atención${data.atencioneMes !== 1 ? 'es' : ''}`}
                color="blue"
              />
            </div>

            {/* Listado */}
            <div>
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
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
