// pages/flota/Dashboard.jsx
import { useNavigate } from 'react-router-dom'
import { useDashboard } from '../../hooks/useFlota'

const fmt = n => n != null ? `$${Number(n).toLocaleString('es-CL')}` : '—'
const fmtKm = n => n != null ? `${Number(n).toLocaleString('es-CL')} km` : '—'

export default function FlotaDashboard() {
  const { data, loading, error } = useDashboard()
  const navigate = useNavigate()

  if (loading) return <div className="p-8 text-zinc-500 text-sm">Cargando…</div>
  if (error)   return <div className="p-8 text-red-400 text-sm">Error: {error}</div>
  if (!data)   return null

  const { vehiculos, gastosMes, alertas, tablaVehiculos } = data
  const totalDocsAlertas = (alertas?.documentosVencidos?.length ?? 0)
                         + (alertas?.documentosCriticos?.length ?? 0)

  // Bloques de atención
  const atencion = []
  if ((alertas?.mantVencidas?.length ?? 0) > 0)
    atencion.push({ tipo: 'MANT_VENCIDA', count: alertas.mantVencidas.length,
      label: 'Mantención vencida', sub: `${alertas.mantVencidas.map(v => v.patente).join(', ')}`,
      color: 'border-red-500/40 bg-red-500/5 text-red-400', icon: '🔧' })
  if ((alertas?.mantProximas?.length ?? 0) > 0)
    atencion.push({ tipo: 'MANT_PROXIMA', count: alertas.mantProximas.length,
      label: 'Mantención próxima', sub: `${alertas.mantProximas.map(v => v.patente).join(', ')}`,
      color: 'border-amber-500/40 bg-amber-500/5 text-amber-400', icon: '⚠️' })
  if ((alertas?.fueraDeServicio?.length ?? 0) > 0)
    atencion.push({ tipo: 'FUERA_SERVICIO', count: alertas.fueraDeServicio.length,
      label: 'Fuera de servicio', sub: `${alertas.fueraDeServicio.map(v => v.patente).join(', ')}`,
      color: 'border-zinc-500/40 bg-zinc-500/5 text-zinc-300', icon: '🚫' })
  if (totalDocsAlertas > 0)
    atencion.push({ tipo: 'DOCS', count: totalDocsAlertas,
      label: 'Documentos vencidos/críticos', sub: 'Revisar documentación',
      color: 'border-red-500/40 bg-red-500/5 text-red-400', icon: '📄' })

  return (
    <div className="p-7">
      <h1 className="text-xl font-bold text-white mb-6">Dashboard</h1>

      {/* Bloque "Requiere atención" */}
      {atencion.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
            Requiere atención
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {atencion.map((a, i) => (
              <button
                key={i}
                onClick={() => navigate(a.tipo === 'DOCS' ? '/flota/vehiculos' : '/flota/vehiculos')}
                className={`text-left border rounded-xl p-4 transition-opacity hover:opacity-80 ${a.color}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl leading-none mt-0.5">{a.icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl font-bold leading-none">{a.count}</span>
                    </div>
                    <div className="text-xs font-semibold leading-tight">{a.label}</div>
                    <div className="text-xs opacity-60 truncate mt-0.5">{a.sub}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* KPIs de flota */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPI label="Total vehículos"    value={vehiculos.total}           />
        <KPI label="Operativos"         value={vehiculos.operativos}      color="text-green-400" />
        <KPI label="En taller"          value={vehiculos.enTaller}        color="text-amber-400" />
        <KPI label="Fuera de servicio"  value={vehiculos.fueraDeServicio} color="text-red-400"   />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
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
            {totalDocsAlertas > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[11px] font-bold bg-red-500/20 text-red-400 rounded-full">
                {totalDocsAlertas}
              </span>
            )}
          </h2>
          {totalDocsAlertas === 0 && (alertas?.documentosProximos?.length ?? 0) === 0 ? (
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

      {/* Tabla operacional de vehículos */}
      {tablaVehiculos?.length > 0 && (
        <div className="bg-[#222] border border-[#363636] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#363636]">
            <h2 className="text-sm font-bold text-zinc-300">Estado operacional</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a]">
                  <th className="text-left text-xs text-zinc-500 font-semibold px-5 py-3 uppercase tracking-wide">Vehículo</th>
                  <th className="text-left text-xs text-zinc-500 font-semibold px-3 py-3 uppercase tracking-wide">Estado</th>
                  <th className="text-left text-xs text-zinc-500 font-semibold px-3 py-3 uppercase tracking-wide">Conductor</th>
                  <th className="text-right text-xs text-zinc-500 font-semibold px-3 py-3 uppercase tracking-wide">Odómetro</th>
                  <th className="text-left text-xs text-zinc-500 font-semibold px-3 py-3 uppercase tracking-wide">Mantención</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {tablaVehiculos.map(v => (
                  <VehiculoFila key={v.id} v={v} onDetalle={() => navigate(`/flota/vehiculos/${v.id}`)} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function VehiculoFila({ v, onDetalle }) {
  const estadoVeh = {
    OPERATIVO:        'text-green-400',
    EN_TALLER:        'text-amber-400',
    FUERA_DE_SERVICIO:'text-red-400',
  }[v.estado] ?? 'text-zinc-400'

  const estadoVehLabel = {
    OPERATIVO:        'Operativo',
    EN_TALLER:        'En taller',
    FUERA_DE_SERVICIO:'Fuera serv.',
  }[v.estado] ?? v.estado

  return (
    <tr className="border-b border-[#2a2a2a] last:border-0 hover:bg-white/[0.02] transition-colors">
      <td className="px-5 py-3">
        <div className="font-semibold text-white">{v.patente}</div>
        <div className="text-xs text-zinc-500">{v.marca} {v.modelo}</div>
      </td>
      <td className="px-3 py-3">
        <span className={`text-xs font-semibold ${estadoVeh}`}>{estadoVehLabel}</span>
      </td>
      <td className="px-3 py-3 text-zinc-300">
        {v.conductor?.nombre ?? <span className="text-zinc-600">Sin asignar</span>}
      </td>
      <td className="px-3 py-3 text-right text-zinc-400 font-mono text-xs">
        {fmtKm(v.odometroActual)}
      </td>
      <td className="px-3 py-3">
        <BadgeMant estadoMant={v.estadoMant} proxFecha={v.proxMantencionFecha} proxKm={v.proxMantencionKm} />
      </td>
      <td className="px-5 py-3 text-right">
        <button
          onClick={onDetalle}
          className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          Ver →
        </button>
      </td>
    </tr>
  )
}

function BadgeMant({ estadoMant, proxFecha, proxKm }) {
  if (!proxFecha && !proxKm) return <span className="text-xs text-zinc-600">—</span>

  const styles = {
    OK:      'bg-green-500/10 text-green-400',
    PROXIMA: 'bg-amber-500/10 text-amber-400',
    VENCIDA: 'bg-red-500/10 text-red-400',
  }[estadoMant] ?? 'bg-zinc-700/50 text-zinc-400'

  const label = proxFecha
    ? new Date(proxFecha).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : proxKm ? fmtKm(proxKm) : '—'

  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-md ${styles}`}>
      {label}
    </span>
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
  const label = nivel === 'VENCIDO' ? 'VENCIDO' : `${doc.diasRestantes}d`
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${cls}`}>
      <span className="text-xs font-bold w-14 flex-shrink-0">{label}</span>
      <span className="text-xs flex-1 truncate">
        {doc.vehiculo?.patente} · {doc.tipo?.replace(/_/g, ' ')}
      </span>
    </div>
  )
}
