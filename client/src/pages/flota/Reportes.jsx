// pages/flota/Reportes.jsx
// Vista on-screen del reporte mensual de flota (total flota por mes).
// Complementa el Excel existente — sin exportación propia.

import { useState } from 'react'
import { useReporteMensual } from '../../hooks/useFlota'

const CLP = v => v.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
const NUM = v => v.toLocaleString('es-CL')

function StatChip({ label, value, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex flex-col gap-0.5">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <span className="text-xl font-bold text-gray-900 leading-tight">{value}</span>
      {sub && <span className="text-[11px] text-gray-400">{sub}</span>}
    </div>
  )
}

export default function Reportes() {
  const anioActual = new Date().getFullYear()
  const [anio, setAnio] = useState(anioActual)

  const { data, loading, error } = useReporteMensual(anio)

  const anios = [anioActual - 1, anioActual, anioActual + 1].filter(a => a >= 2024)

  return (
    <div className="p-4 md:p-7 space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reportes Mensuales</h1>
          <p className="text-sm text-gray-500 mt-0.5">Total flota — km, combustible y peajes por mes</p>
        </div>
        {/* Selector de año */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
          {anios.map(a => (
            <button
              key={a}
              onClick={() => setAnio(a)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap
                ${anio === a
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-center py-16 text-gray-400 text-sm">Cargando…</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {data && !loading && (
        <>
          {/* Chips resumen anual */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatChip
              label="Km recorridos"
              value={`${NUM(data.totales.kmRecorridos)} km`}
              sub="Total año"
            />
            <StatChip
              label="Combustible"
              value={CLP(data.totales.montoCombustible)}
              sub={`${NUM(Math.round(data.totales.litros * 10) / 10)} L cargados`}
            />
            <StatChip
              label="Peajes"
              value={CLP(data.totales.montoPeajes)}
              sub="Total año"
            />
            <StatChip
              label="Actividades"
              value={NUM(data.totales.nActividades)}
              sub="Registros en el año"
            />
          </div>

          {/* Tabla mensual */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
              <span className="text-sm font-semibold text-gray-800">Desglose mensual {anio}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Mes</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Km recorridos</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Litros</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Combustible</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Peajes</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Total gastos</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Actividades</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.meses.map((m) => {
                    const totalGasto = m.montoCombustible + m.montoPeajes
                    const sinDatos   = m.nActividades === 0
                    return (
                      <tr key={m.mesNum} className={`hover:bg-amber-50/40 transition-colors ${sinDatos ? 'opacity-40' : ''}`}>
                        <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">{m.mes}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                          {m.kmRecorridos > 0 ? `${NUM(m.kmRecorridos)} km` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                          {m.litros > 0 ? `${NUM(Math.round(m.litros * 10) / 10)} L` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                          {m.montoCombustible > 0 ? CLP(m.montoCombustible) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                          {m.montoPeajes > 0 ? CLP(m.montoPeajes) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-900">
                          {totalGasto > 0 ? CLP(totalGasto) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-500">
                          {m.nActividades > 0 ? m.nActividades : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {/* Fila totales */}
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Total {anio}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-gray-900">
                      {data.totales.kmRecorridos > 0 ? `${NUM(data.totales.kmRecorridos)} km` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-gray-900">
                      {data.totales.litros > 0 ? `${NUM(Math.round(data.totales.litros * 10) / 10)} L` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-gray-900">
                      {data.totales.montoCombustible > 0 ? CLP(data.totales.montoCombustible) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-gray-900">
                      {data.totales.montoPeajes > 0 ? CLP(data.totales.montoPeajes) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-amber-600">
                      {(data.totales.montoCombustible + data.totales.montoPeajes) > 0
                        ? CLP(data.totales.montoCombustible + data.totales.montoPeajes)
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-gray-900">
                      {data.totales.nActividades > 0 ? data.totales.nActividades : '—'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {data.meses.every(m => m.nActividades === 0) && (
            <p className="text-center text-sm text-gray-400 py-4">
              No hay actividades registradas en {anio}
            </p>
          )}
        </>
      )}
    </div>
  )
}
