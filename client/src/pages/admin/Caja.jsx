import { useEffect, useState } from 'react'
import { BanknoteIcon, CalendarDays, Car, TrendingUp } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { getResumenCaja } from '../../services/cajaService'

const formatCLP = (v) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v || 0)

const formatFecha = (iso) => {
  const d = new Date(iso)
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatHora = (iso) => {
  const d = new Date(iso)
  return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

// ── Tarjeta de estadística ────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color = 'blue' }) {
  const colors = {
    blue:  'bg-[#6C8EFF]/10 text-[#6C8EFF]',
    green: 'bg-green-500/10 text-green-400',
  }
  return (
    <div className="bg-surface border border-line rounded-2xl p-5 flex items-start gap-4">
      <div className={`rounded-xl p-3 ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-muted uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function Caja() {
  useDocumentTitle('Caja — AgendaCar')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getResumenCaja()
      .then(setData)
      .catch(() => setError('No se pudo cargar el resumen de caja.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-2xl font-bold text-white">Caja</h1>

        {loading && (
          <p className="text-muted text-sm">Cargando...</p>
        )}

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

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
              <h2 className="text-sm font-semibold text-white mb-3">Atenciones recientes</h2>

              {data.recientes.length === 0 ? (
                <div className="bg-surface border border-line rounded-2xl p-8 text-center text-muted text-sm">
                  Aún no hay atenciones registradas.
                </div>
              ) : (
                <div className="bg-surface border border-line rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line text-xs text-muted uppercase tracking-wide">
                        <th className="text-left px-4 py-3">Fecha</th>
                        <th className="text-left px-4 py-3">Cliente</th>
                        <th className="text-left px-4 py-3 hidden sm:table-cell">Vehículo</th>
                        <th className="text-left px-4 py-3 hidden sm:table-cell">Servicio</th>
                        <th className="text-right px-4 py-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recientes.map((c, i) => (
                        <tr
                          key={c.id}
                          className={`border-b border-line last:border-0 ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}
                        >
                          <td className="px-4 py-3 text-muted whitespace-nowrap">
                            <span className="text-white">{formatFecha(c.createdAt)}</span>
                            <span className="block text-xs">{formatHora(c.createdAt)}</span>
                          </td>
                          <td className="px-4 py-3 text-white font-medium">
                            {c.reserva?.nombre || '—'}
                            <span className="block text-xs text-muted font-normal">{c.reserva?.patente}</span>
                          </td>
                          <td className="px-4 py-3 text-muted hidden sm:table-cell">
                            {[c.reserva?.vehiculo?.marca, c.reserva?.vehiculo?.modelo].filter(Boolean).join(' ') || '—'}
                          </td>
                          <td className="px-4 py-3 text-muted hidden sm:table-cell">
                            {c.reserva?.servicio?.nombre || '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-white whitespace-nowrap">
                            {formatCLP(c.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
