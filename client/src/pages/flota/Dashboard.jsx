// pages/flota/Dashboard.jsx
import { useDashboard } from '../../hooks/useFlota'

const fmt = n => n != null ? `$${Number(n).toLocaleString('es-CL')}` : '—'

export default function FlotaDashboard() {
  const { data, loading, error } = useDashboard()

  if (loading) return <div className="p-8 text-zinc-500 text-sm">Cargando…</div>
  if (error)   return <div className="p-8 text-red-400 text-sm">Error: {error}</div>
  if (!data)   return null

  const { vehiculos, gastosMes, alertas } = data
  const totalAlertas = (alertas?.documentosVencidos?.length ?? 0)
                     + (alertas?.documentosCriticos?.length ?? 0)

  return (
    <div className="p-7">
      <h1 className="text-xl font-bold text-white mb-6">Dashboard</h1>

      {/* KPIs de flota */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPI label="Total vehículos"    value={vehiculos.total}           />
        <KPI label="Operativos"         value={vehiculos.operativos}      color="text-green-400" />
        <KPI label="En taller"          value={vehiculos.enTaller}        color="text-amber-400" />
        <KPI label="Fuera de servicio"  value={vehiculos.fueraDeServicio} color="text-red-400"   />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Gastos del mes */}
        <div className="bg-[#222] border border-[#363636] rounded-xl p-5">
          <h2 className="text-sm font-bold text-zinc-300 mb-4">
            Gastos del mes
            <span className="ml-2 text-xs font-normal text-zinc-500">{gastosMes.mes}</span>
          </h2>
          <div className="space-y-3">
            <GastoRow label="Combustible"  value={gastosMes.combustible} color="bg-blue-400"  />
            <GastoRow label="Peajes"        value={gastosMes.peajes}       color="bg-zinc-400"  />
            <GastoRow label="Mantenciones" value={gastosMes.mantencion}   color="bg-amber-400" />
            <div className="pt-3 border-t border-[#363636] flex justify-between">
              <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Total</span>
              <span className="text-sm font-bold text-white">{fmt(gastosMes.total)}</span>
            </div>
          </div>
        </div>

        {/* Alertas de documentos */}
        <div className="bg-[#222] border border-[#363636] rounded-xl p-5">
          <h2 className="text-sm font-bold text-zinc-300 mb-4">
            Alertas de documentos
            {totalAlertas > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[11px] font-bold bg-red-500/20 text-red-400 rounded-full">
                {totalAlertas}
              </span>
            )}
          </h2>

          {totalAlertas === 0 && (alertas?.documentosProximos?.length ?? 0) === 0 ? (
            <p className="text-sm text-zinc-500">Sin alertas pendientes ✓</p>
          ) : (
            <div className="space-y-2">
              {alertas?.documentosVencidos?.map(d => (
                <AlertaDoc key={d.id} doc={d} nivel="VENCIDO" />
              ))}
              {alertas?.documentosCriticos?.map(d => (
                <AlertaDoc key={d.id} doc={d} nivel="CRITICO" />
              ))}
              {alertas?.documentosProximos?.slice(0, 3).map(d => (
                <AlertaDoc key={d.id} doc={d} nivel="PROXIMO" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function KPI({ label, value, color = 'text-zinc-100' }) {
  return (
    <div className="bg-[#222] border border-[#363636] rounded-xl p-5">
      <div className={`text-3xl font-bold leading-none mb-1.5 ${color}`}>{value ?? '—'}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  )
}

function GastoRow({ label, value, color }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color}`} />
      <span className="text-sm text-zinc-300 flex-1">{label}</span>
      <span className="text-sm font-semibold text-white font-mono">{fmt(value)}</span>
    </div>
  )
}

const NIVEL_STYLES = {
  VENCIDO: 'bg-red-400/10 text-red-400 border border-red-400/20',
  CRITICO: 'bg-amber-400/10 text-amber-400 border border-amber-400/20',
  PROXIMO: 'bg-zinc-700/50 text-zinc-300 border border-zinc-700',
}

function AlertaDoc({ doc, nivel }) {
  const cls = NIVEL_STYLES[nivel]
  const label = nivel === 'VENCIDO' ? 'VENCIDO'
              : nivel === 'CRITICO' ? `${doc.diasRestantes}d`
              : `${doc.diasRestantes}d`
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${cls}`}>
      <span className="text-xs font-bold w-14 flex-shrink-0">{label}</span>
      <span className="text-xs flex-1 truncate">
        {doc.vehiculo?.patente} · {doc.tipo?.replace(/_/g, ' ')}
      </span>
    </div>
  )
}
