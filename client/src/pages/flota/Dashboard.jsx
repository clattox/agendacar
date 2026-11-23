// pages/flota/Dashboard.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboard, useTenantInfo, useGastosHistorico } from '../../hooks/useFlota'
import { getUsuario } from '../../lib/auth'

const fmt   = n => n != null ? `$${Number(n).toLocaleString('es-CL')}` : '—'
const fmtKm = n => n != null ? `${Number(n).toLocaleString('es-CL')} km` : '—'

function saludo() {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return 'Buenos días'
  if (h >= 12 && h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function primerNombre(nombreCompleto) {
  if (!nombreCompleto) return ''
  return nombreCompleto.trim().split(/\s+/)[0]
}

// Genera lista de meses hacia atrás desde hoy
function generarMeses(cantidad = 24) {
  const ahora = new Date()
  const lista = []
  for (let i = 0; i < cantidad; i++) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
    lista.push({ val, label })
  }
  return lista
}

const MESES_LABEL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                     'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function FlotaDashboard() {
  const ahora = new Date()
  const [mesNum, setMesNum] = useState(ahora.getMonth() + 1)   // 1-12
  const [anioNum, setAnioNum] = useState(ahora.getFullYear())

  const mesSel = `${anioNum}-${String(mesNum).padStart(2, '0')}`

  // Años disponibles: desde 2024 hasta el año actual
  const anios = []
  for (let y = ahora.getFullYear(); y >= 2024; y--) anios.push(y)

  const { data, loading, error }  = useDashboard(mesSel)
  const { data: historico }       = useGastosHistorico(6)
  const { data: tenant }          = useTenantInfo()
  const navigate = useNavigate()
  const usuario  = getUsuario()

  if (loading) return <div className="p-8 text-[#737B86] text-sm">Cargando…</div>
  if (error)   return <div className="p-8 text-red-500 text-sm">Error: {error}</div>
  if (!data)   return null

  const { vehiculos, gastosMes, alertas, tablaVehiculos } = data
  const totalDocsAlertas = (alertas?.documentosVencidos?.length ?? 0)
                         + (alertas?.documentosCriticos?.length ?? 0)

  // Bloques de atención
  const atencion = []
  if ((alertas?.mantVencidas?.length ?? 0) > 0)
    atencion.push({ tipo: 'MANT_VENCIDA', count: alertas.mantVencidas.length,
      label: 'Mantención vencida', sub: `${alertas.mantVencidas.map(v => v.patente).join(', ')}`,
      color: 'border-[#FCA5A5] bg-[#FEE2E2] text-[#DC2626]', icon: '🔧' })
  if ((alertas?.mantProximas?.length ?? 0) > 0)
    atencion.push({ tipo: 'MANT_PROXIMA', count: alertas.mantProximas.length,
      label: 'Mantención próxima', sub: `${alertas.mantProximas.map(v => v.patente).join(', ')}`,
      color: 'border-[#FCD34D] bg-[#FEF3C7] text-[#D97706]', icon: '⚠️' })
  if ((alertas?.fueraDeServicio?.length ?? 0) > 0)
    atencion.push({ tipo: 'FUERA_SERVICIO', count: alertas.fueraDeServicio.length,
      label: 'Fuera de servicio', sub: `${alertas.fueraDeServicio.map(v => v.patente).join(', ')}`,
      color: 'border-[#E1E4E8] bg-[#F4F5F6] text-[#737B86]', icon: '🚫' })
  if (totalDocsAlertas > 0)
    atencion.push({ tipo: 'DOCS', count: totalDocsAlertas,
      label: 'Documentos vencidos/críticos', sub: 'Revisar documentación',
      color: 'border-[#FCA5A5] bg-[#FEE2E2] text-[#DC2626]', icon: '📄' })

  return (
    <div className="p-4 md:p-7">

      {/* ——— Header de bienvenida ——— */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 min-w-0">
          {/* Logo de la empresa */}
          {tenant?.logoUrl ? (
            <img
              src={tenant.logoUrl}
              alt={tenant.nombre}
              className="w-12 h-12 rounded-xl object-contain bg-white border border-[#E1E4E8] p-1 flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M5 17H3a1 1 0 0 1-1-1v-5l2.5-5H17l2.5 5H22v5a1 1 0 0 1-1 1h-2" />
                <circle cx="7.5" cy="17.5" r="2.5" />
                <circle cx="16.5" cy="17.5" r="2.5" />
              </svg>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs text-[#737B86] font-medium">
              {saludo()}{usuario?.nombre ? `, ${primerNombre(usuario.nombre)}` : ''}
            </p>
            <h1 className="text-xl font-bold text-[#252A31] leading-tight truncate">
              {tenant?.nombre || 'Control de Flota'}
            </h1>
          </div>
        </div>

        {/* Fecha del día */}
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-[#737B86]">
            {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <p className="text-sm font-semibold text-[#737B86] capitalize">
            {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* Bloque "Requiere atención" */}
      {atencion.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold text-[#737B86] uppercase tracking-widest mb-3">
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
        <KPI label="Operativos"         value={vehiculos.operativos}      color="text-[#16A34A]" />
        <KPI label="En taller"          value={vehiculos.enTaller}        color="text-[#D97706]" />
        <KPI label="Fuera de servicio"  value={vehiculos.fueraDeServicio} color="text-[#DC2626]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {/* Gastos del mes */}
        <div className="bg-white border border-[#E1E4E8] rounded-xl p-5">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h2 className="text-sm font-bold text-[#252A31]">Gastos del mes</h2>
            <div className="flex items-center gap-2">
              <select
                value={mesNum}
                onChange={e => setMesNum(Number(e.target.value))}
                className="text-xs border border-[#E1E4E8] rounded-lg px-2.5 py-1.5 bg-white text-[#252A31] focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
              >
                {MESES_LABEL.map((label, i) => (
                  <option key={i + 1} value={i + 1}>{label}</option>
                ))}
              </select>
              <select
                value={anioNum}
                onChange={e => setAnioNum(Number(e.target.value))}
                className="text-xs border border-[#E1E4E8] rounded-lg px-2.5 py-1.5 bg-white text-[#252A31] focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
              >
                {anios.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-3">
            <GastoRow label="Combustible"  value={gastosMes.combustible} color="bg-blue-400"  />
            <GastoRow label="Peajes"        value={gastosMes.peajes}       color="bg-[#A0A6AE]" />
            <GastoRow label="Mantenciones" value={gastosMes.mantencion}   color="bg-amber-400" />
            <div className="pt-3 border-t border-[#E5E7EB] flex justify-between">
              <span className="text-xs text-[#737B86] font-semibold uppercase tracking-wide">Total</span>
              <span className="text-sm font-bold text-[#252A31]">{fmt(gastosMes.total)}</span>
            </div>
          </div>
          {/* Gráfico histórico */}
          {historico && historico.length > 0 && (
            <div className="mt-5 pt-4 border-t border-[#E5E7EB]">
              <p className="text-xs text-[#737B86] font-semibold uppercase tracking-wide mb-3">Histórico de gastos</p>
              <GraficoBarras datos={historico} mesSeleccionado={mesSel} />
            </div>
          )}
        </div>

        {/* Alertas de documentos */}
        <div className="bg-white border border-[#E1E4E8] rounded-xl p-5">
          <h2 className="text-sm font-bold text-[#252A31] mb-4">
            Alertas de documentos
            {totalDocsAlertas > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[11px] font-bold bg-[#FEE2E2] text-[#DC2626] rounded-full">
                {totalDocsAlertas}
              </span>
            )}
          </h2>
          {totalDocsAlertas === 0 && (alertas?.documentosProximos?.length ?? 0) === 0 ? (
            <p className="text-sm text-[#737B86]">Sin alertas pendientes ✓</p>
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
        <div className="bg-white border border-[#E1E4E8] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E1E4E8]">
            <h2 className="text-sm font-bold text-[#252A31]">Estado operacional</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="bg-[#F4F5F6] border-b border-[#E5E7EB]">
                  <th className="text-left text-xs text-[#737B86] font-semibold px-5 py-3 uppercase tracking-wide">Vehículo</th>
                  <th className="text-left text-xs text-[#737B86] font-semibold px-3 py-3 uppercase tracking-wide">Estado</th>
                  <th className="text-left text-xs text-[#737B86] font-semibold px-3 py-3 uppercase tracking-wide">Conductor</th>
                  <th className="text-right text-xs text-[#737B86] font-semibold px-3 py-3 uppercase tracking-wide">Odómetro</th>
                  <th className="text-left text-xs text-[#737B86] font-semibold px-3 py-3 uppercase tracking-wide">Mantención</th>
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
    OPERATIVO:        'text-[#16A34A]',
    EN_TALLER:        'text-[#D97706]',
    FUERA_DE_SERVICIO:'text-[#DC2626]',
  }[v.estado] ?? 'text-[#737B86]'

  const estadoVehLabel = {
    OPERATIVO:        'Operativo',
    EN_TALLER:        'En taller',
    FUERA_DE_SERVICIO:'Fuera serv.',
  }[v.estado] ?? v.estado

  return (
    <tr className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F4F5F6] transition-colors">
      <td className="px-5 py-3">
        <div className="font-semibold text-[#252A31] whitespace-nowrap">{v.patente}</div>
        <div className="text-xs text-[#737B86] whitespace-nowrap">{v.marca} {v.modelo}</div>
      </td>
      <td className="px-3 py-3">
        <span className={`text-xs font-semibold ${estadoVeh}`}>{estadoVehLabel}</span>
      </td>
      <td className="px-3 py-3 text-[#252A31]">
        {v.conductor?.nombre ?? <span className="text-[#A0A6AE]">Sin asignar</span>}
      </td>
      <td className="px-3 py-3 text-right text-[#737B86] font-mono text-xs whitespace-nowrap">
        {fmtKm(v.odometroActual)}
      </td>
      <td className="px-3 py-3">
        <BadgeMant estadoMant={v.estadoMant} proxFecha={v.proxMantencionFecha} proxKm={v.proxMantencionKm} />
      </td>
      <td className="px-5 py-3 text-right">
        <button
          onClick={onDetalle}
          className="text-xs text-[#737B86] hover:text-amber-500 transition-colors font-medium"
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
    OK:      'bg-[#DCFCE7] text-[#16A34A]',
    PROXIMA: 'bg-[#FEF3C7] text-[#D97706]',
    VENCIDA: 'bg-[#FEE2E2] text-[#DC2626]',
  }[estadoMant] ?? 'bg-[#F4F5F6] text-[#737B86]'

  const label = proxFecha
    ? new Date(proxFecha).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : proxKm ? fmtKm(proxKm) : '—'

  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-md ${styles}`}>
      {label}
    </span>
  )
}

function KPI({ label, value, color = 'text-[#252A31]' }) {
  return (
    <div className="bg-white border border-[#E1E4E8] rounded-xl p-5">
      <div className={`text-3xl font-bold leading-none mb-1.5 ${color}`}>{value ?? '—'}</div>
      <div className="text-xs text-[#737B86]">{label}</div>
    </div>
  )
}

function GastoRow({ label, value, color }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color}`} />
      <span className="text-sm text-[#252A31] flex-1">{label}</span>
      <span className="text-sm font-semibold text-[#252A31] font-mono">{fmt(value)}</span>
    </div>
  )
}

const NIVEL_STYLES = {
  VENCIDO: 'bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]',
  CRITICO: 'bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D]',
  PROXIMO: 'bg-[#F4F5F6] text-[#737B86] border border-[#E1E4E8]',
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

function GraficoBarras({ datos, mesSeleccionado }) {
  if (!datos || datos.length === 0) return null

  const maxTotal = Math.max(...datos.map(d => d.total ?? 0), 1)
  const H = 90    // altura útil en px del área de barras
  const BAR_W = 26
  const GAP    = 8
  const LEFT   = 34  // espacio para etiqueta del eje Y
  const BOTTOM = 26  // espacio para etiquetas del eje X
  const totalW = LEFT + datos.length * (BAR_W + GAP) - GAP + 4

  // Líneas guía del eje Y (0, 50%, 100%)
  const guias = [0, 0.5, 1].map(pct => ({
    pct,
    y: H - pct * H,
    label: pct === 0 ? '0' : pct === 1
      ? `$${Math.round(maxTotal / 1000)}k`
      : `$${Math.round(maxTotal * 0.5 / 1000)}k`,
  }))

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${totalW} ${H + BOTTOM + 4}`}
        style={{ width: '100%', maxWidth: '100%', height: 'auto', maxHeight: 180, display: 'block' }}
        aria-label="Gráfico de gastos históricos"
      >
        {/* Líneas guía */}
        {guias.map(g => (
          <g key={g.pct}>
            <line
              x1={LEFT} y1={g.y + 2} x2={totalW} y2={g.y + 2}
              stroke="#E5E7EB" strokeWidth="1" strokeDasharray={g.pct === 0 ? '0' : '3,3'}
            />
            <text
              x={LEFT - 4} y={g.y + 2}
              textAnchor="end" dominantBaseline="middle"
              style={{ fontSize: 8, fill: '#A0A6AE', fontFamily: 'sans-serif' }}
            >
              {g.label}
            </text>
          </g>
        ))}

        {/* Barras por mes */}
        {datos.map((d, i) => {
          const x     = LEFT + i * (BAR_W + GAP)
          const total = d.total ?? 0

          // alturas de cada segmento
          const hComb = total > 0 ? Math.max((d.combustible / maxTotal) * H, 0) : 0
          const hPeaj = total > 0 ? Math.max((d.peajes      / maxTotal) * H, 0) : 0
          const hMant = total > 0 ? Math.max((d.mantencion  / maxTotal) * H, 0) : 0

          // posiciones Y (apiladas desde abajo)
          const yComb = H - hComb
          const yPeaj = yComb - hPeaj
          const yMant = yPeaj - hMant

          const esMesAct = d.mes === mesSeleccionado
          const opacity  = esMesAct ? 1 : 0.65

          return (
            <g key={d.mes} opacity={opacity}>
              {/* Mantenciones (arriba) — amber */}
              {hMant > 0 && (
                <rect x={x} y={yMant + 2} width={BAR_W} height={hMant}
                  rx={hComb <= 0 && hPeaj <= 0 ? 3 : 0}
                  fill="#F59E0B"
                />
              )}
              {/* Peajes (medio) — gris */}
              {hPeaj > 0 && (
                <rect x={x} y={yPeaj + 2} width={BAR_W} height={hPeaj}
                  rx={hComb <= 0 ? 3 : 0}
                  fill="#A0A6AE"
                />
              )}
              {/* Combustible (base) — azul, con bordes redondeados abajo */}
              {hComb > 0 && (
                <rect x={x} y={yComb + 2} width={BAR_W} height={hComb}
                  rx={3}
                  fill="#60A5FA"
                />
              )}
              {/* Barra vacía si no hay gastos */}
              {total === 0 && (
                <rect x={x} y={H - 3 + 2} width={BAR_W} height={3}
                  rx={1} fill="#E5E7EB"
                />
              )}
              {/* Indicador del mes seleccionado */}
              {esMesAct && (
                <rect x={x + BAR_W / 2 - 2} y={H + 7} width={4} height={4}
                  rx={2} fill="#F59E0B"
                />
              )}
              {/* Etiqueta del eje X */}
              <text
                x={x + BAR_W / 2}
                y={H + BOTTOM}
                textAnchor="middle"
                style={{
                  fontSize: 8,
                  fill: esMesAct ? '#252A31' : '#A0A6AE',
                  fontWeight: esMesAct ? 'bold' : 'normal',
                  fontFamily: 'sans-serif',
                }}
              >
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Leyenda */}
      <div className="flex items-center gap-4 mt-2 justify-center">
        {[
          { color: 'bg-blue-400',  label: 'Combustible' },
          { color: 'bg-[#A0A6AE]', label: 'Peajes' },
          { color: 'bg-amber-400', label: 'Mantenciones' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.color}`} />
            <span className="text-[10px] text-[#737B86]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
