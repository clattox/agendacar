// pages/flota/Reportes.jsx
// Vista on-screen del reporte mensual de flota.
// Por defecto muestra el MES ACTUAL con stats de ese mes.
// Selector de mes + año para navegar. Selector de vehículo para filtrar.
// Opción "Ver año completo" muestra la tabla con los 12 meses.

import { useState } from 'react'
import { useReporteMensual, useVehiculosLista } from '../../hooks/useFlota'

const CLP = v => v.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
const NUM = v => v.toLocaleString('es-CL')

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function StatChip({ label, value, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex flex-col gap-0.5">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <span className="text-xl font-bold text-gray-900 leading-tight">{value}</span>
      {sub && <span className="text-[11px] text-gray-400">{sub}</span>}
    </div>
  )
}

function TablaReporte({ meses, totales, titulo, mostrarTotales = true }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {titulo && (
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
          </svg>
          <span className="text-sm font-semibold text-gray-800">{titulo}</span>
        </div>
      )}
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
            {meses.map(m => {
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
          {mostrarTotales && totales && (
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Total</td>
                <td className="px-4 py-3 text-right tabular-nums font-bold text-gray-900">
                  {totales.kmRecorridos > 0 ? `${NUM(totales.kmRecorridos)} km` : '—'}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-bold text-gray-900">
                  {totales.litros > 0 ? `${NUM(Math.round(totales.litros * 10) / 10)} L` : '—'}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-bold text-gray-900">
                  {totales.montoCombustible > 0 ? CLP(totales.montoCombustible) : '—'}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-bold text-gray-900">
                  {totales.montoPeajes > 0 ? CLP(totales.montoPeajes) : '—'}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-bold text-amber-600">
                  {(totales.montoCombustible + totales.montoPeajes) > 0
                    ? CLP(totales.montoCombustible + totales.montoPeajes)
                    : '—'}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-bold text-gray-900">
                  {totales.nActividades > 0 ? totales.nActividades : '—'}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}

function exportarPDF({ titulo, chips, meses, totales, mostrarTotales = true }) {
  const filas = meses.map(m => {
    const totalGasto = m.montoCombustible + m.montoPeajes
    const sinDatos   = m.nActividades === 0
    return `
      <tr style="opacity:${sinDatos ? 0.4 : 1}">
        <td>${m.mes}</td>
        <td class="num">${m.kmRecorridos > 0 ? `${NUM(m.kmRecorridos)} km` : '—'}</td>
        <td class="num">${m.litros > 0 ? `${NUM(Math.round(m.litros * 10) / 10)} L` : '—'}</td>
        <td class="num">${m.montoCombustible > 0 ? CLP(m.montoCombustible) : '—'}</td>
        <td class="num">${m.montoPeajes > 0 ? CLP(m.montoPeajes) : '—'}</td>
        <td class="num bold">${totalGasto > 0 ? CLP(totalGasto) : '—'}</td>
        <td class="num">${m.nActividades > 0 ? m.nActividades : '—'}</td>
      </tr>`
  }).join('')

  const filaTotales = mostrarTotales && totales ? `
    <tfoot>
      <tr class="total-row">
        <td>Total</td>
        <td class="num">${totales.kmRecorridos > 0 ? `${NUM(totales.kmRecorridos)} km` : '—'}</td>
        <td class="num">${totales.litros > 0 ? `${NUM(Math.round(totales.litros * 10) / 10)} L` : '—'}</td>
        <td class="num">${totales.montoCombustible > 0 ? CLP(totales.montoCombustible) : '—'}</td>
        <td class="num">${totales.montoPeajes > 0 ? CLP(totales.montoPeajes) : '—'}</td>
        <td class="num amber">${(totales.montoCombustible + totales.montoPeajes) > 0 ? CLP(totales.montoCombustible + totales.montoPeajes) : '—'}</td>
        <td class="num">${totales.nActividades > 0 ? totales.nActividades : '—'}</td>
      </tr>
    </tfoot>` : ''

  const chipsHtml = chips.map(c => `
    <div class="chip">
      <div class="chip-label">${c.label}</div>
      <div class="chip-value">${c.value}</div>
      ${c.sub ? `<div class="chip-sub">${c.sub}</div>` : ''}
    </div>`).join('')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${titulo}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, Arial, sans-serif; font-size: 12px; color: #111; padding: 32px; }
  h1 { font-size: 18px; font-weight: 700; margin-bottom: 2px; }
  .subtitle { font-size: 11px; color: #666; margin-bottom: 20px; }
  .chips { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
  .chip { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 14px; min-width: 130px; }
  .chip-label { font-size: 10px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.03em; }
  .chip-value { font-size: 16px; font-weight: 700; margin: 2px 0 1px; }
  .chip-sub { font-size: 10px; color: #9ca3af; }
  h2 { font-size: 13px; font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
  h2::before { content: ''; display: inline-block; width: 12px; height: 12px; background: #f59e0b; border-radius: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { text-align: left; padding: 7px 10px; font-size: 10px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 2px solid #e5e7eb; background: #f9fafb; }
  td { padding: 7px 10px; border-bottom: 1px solid #f3f4f6; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .bold { font-weight: 600; }
  tfoot .total-row td { font-weight: 700; border-top: 2px solid #d1d5db; border-bottom: none; background: #f9fafb; }
  .amber { color: #d97706; }
  .footer { margin-top: 24px; font-size: 10px; color: #9ca3af; text-align: right; }
</style>
</head>
<body>
  <h1>${titulo}</h1>
  <div class="subtitle">Generado el ${new Date().toLocaleDateString('es-CL', { day:'2-digit', month:'long', year:'numeric' })}</div>
  <div class="chips">${chipsHtml}</div>
  <h2>Detalle</h2>
  <table>
    <thead>
      <tr>
        <th>Mes</th>
        <th style="text-align:right">Km recorridos</th>
        <th style="text-align:right">Litros</th>
        <th style="text-align:right">Combustible</th>
        <th style="text-align:right">Peajes</th>
        <th style="text-align:right">Total gastos</th>
        <th style="text-align:right">Actividades</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
    ${filaTotales}
  </table>
  <div class="footer">AgendaCar · Reporte de flota</div>
</body>
</html>`

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  win.onload = () => { win.focus(); win.print() }
}

export default function Reportes() {
  const hoy       = new Date()
  const anioActual = hoy.getFullYear()
  const mesActual  = hoy.getMonth() // 0-indexed

  const [anio,       setAnio]       = useState(anioActual)
  const [mes,        setMes]        = useState(mesActual)   // 0-indexed
  const [vehiculoId, setVehiculoId] = useState('')
  const [verAnio,    setVerAnio]    = useState(false)       // toggle tabla anual

  const { data, loading, error }                   = useReporteMensual(anio, vehiculoId || null)
  const { data: vehiculos, error: vehiculosError } = useVehiculosLista()

  // Años disponibles: desde 2024 hasta 2030 (o el año actual si supera 2030)
  const ANIO_INICIO = 2024
  const ANIO_FIN    = Math.max(2030, anioActual)
  const anios = Array.from({ length: ANIO_FIN - ANIO_INICIO + 1 }, (_, i) => ANIO_INICIO + i)

  // Meses disponibles: todos si es año pasado o futuro; hasta el mes actual si es el año en curso
  const mesesDisponibles = MESES.map((nombre, i) => ({ idx: i, nombre })).filter(({ idx }) => {
    if (anio !== anioActual) return true
    return idx <= mesActual
  })

  // Mes seleccionado de los datos
  const mesSeleccionado = data?.meses?.find(m => m.mesNum === mes + 1)

  // Si cambiamos al año actual y el mes seleccionado supera el mes actual → ajustar
  function handleAnioChange(nuevoAnio) {
    setAnio(nuevoAnio)
    if (nuevoAnio === anioActual && mes > mesActual) setMes(mesActual)
  }

  return (
    <div className="p-4 md:p-7 space-y-5 max-w-5xl">

      {/* ——— Header ——— */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Reportes</h1>
        <p className="text-sm text-gray-500 mt-0.5">Consumos y actividad de la flota</p>
      </div>

      {/* ——— Filtros ——— */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-4 items-end">

        {/* Selector año */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-500">Año</span>
          <select
            value={anio}
            onChange={e => handleAnioChange(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
          >
            {anios.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {/* Selector mes */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-500">Mes</span>
          <select
            value={mes}
            onChange={e => { setMes(Number(e.target.value)); setVerAnio(false) }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
          >
            {mesesDisponibles.map(({ idx, nombre }) => (
              <option key={idx} value={idx}>{nombre}</option>
            ))}
          </select>
        </div>

        {/* Selector vehículo */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-500">Vehículo</span>
          <select
            value={vehiculoId}
            onChange={e => setVehiculoId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 min-w-[180px]"
          >
            <option value="">Toda la flota</option>
            {Array.isArray(vehiculos) && vehiculos.map(v => (
              <option key={v.id} value={v.id}>{v.patente} — {v.marca} {v.modelo}</option>
            ))}
          </select>
          {vehiculosError && (
            <span className="text-[11px] text-red-500">Error al cargar vehículos</span>
          )}
        </div>

        {/* Toggle vista anual */}
        <div className="ml-auto">
          <button
            onClick={() => setVerAnio(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border whitespace-nowrap
              ${verAnio
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            {verAnio ? 'Vista mensual' : 'Ver año completo'}
          </button>
        </div>
      </div>

      {/* ——— Estado de carga / error ——— */}
      {loading && <div className="text-center py-16 text-gray-400 text-sm">Cargando…</div>}
      {error   && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {data && !loading && (
        <>
          {/* ——— Vista: MES SELECCIONADO ——— */}
          {!verAnio && (
            <>
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <h2 className="text-base font-semibold text-gray-800">
                  {MESES[mes]} {anio}
                  {vehiculoId && vehiculos && (
                    <span className="ml-2 text-sm font-normal text-gray-400">
                      · {vehiculos.find(v => v.id === vehiculoId)?.patente}
                    </span>
                  )}
                </h2>
                {mesSeleccionado && mesSeleccionado.nActividades > 0 && (
                  <button
                    onClick={() => {
                      const patente = vehiculoId && vehiculos ? vehiculos.find(v => v.id === vehiculoId)?.patente : null
                      exportarPDF({
                        titulo: `Reporte ${MESES[mes]} ${anio}${patente ? ' · ' + patente : ''}`,
                        chips: [
                          { label: 'Km recorridos', value: `${NUM(mesSeleccionado.kmRecorridos)} km`, sub: 'En el mes' },
                          { label: 'Combustible', value: CLP(mesSeleccionado.montoCombustible), sub: mesSeleccionado.litros > 0 ? `${NUM(Math.round(mesSeleccionado.litros * 10) / 10)} L cargados` : 'Sin registros' },
                          { label: 'Peajes', value: CLP(mesSeleccionado.montoPeajes), sub: 'En el mes' },
                          { label: 'Total gastos', value: CLP(mesSeleccionado.montoCombustible + mesSeleccionado.montoPeajes), sub: `${mesSeleccionado.nActividades} actividades` },
                        ],
                        meses: [mesSeleccionado],
                        mostrarTotales: false,
                      })
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors whitespace-nowrap"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a1 1 0 001 1h16a1 1 0 001-1v-3" />
                    </svg>
                    Exportar PDF
                  </button>
                )}
              </div>

              {/* Stats del mes */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatChip
                  label="Km recorridos"
                  value={mesSeleccionado ? `${NUM(mesSeleccionado.kmRecorridos)} km` : '—'}
                  sub="En el mes"
                />
                <StatChip
                  label="Combustible"
                  value={mesSeleccionado ? CLP(mesSeleccionado.montoCombustible) : '—'}
                  sub={mesSeleccionado?.litros > 0
                    ? `${NUM(Math.round(mesSeleccionado.litros * 10) / 10)} L cargados`
                    : 'Sin registros'}
                />
                <StatChip
                  label="Peajes"
                  value={mesSeleccionado ? CLP(mesSeleccionado.montoPeajes) : '—'}
                  sub="En el mes"
                />
                <StatChip
                  label="Total gastos"
                  value={mesSeleccionado
                    ? CLP(mesSeleccionado.montoCombustible + mesSeleccionado.montoPeajes)
                    : '—'}
                  sub={mesSeleccionado?.nActividades > 0
                    ? `${mesSeleccionado.nActividades} actividades`
                    : 'Sin actividades'}
                />
              </div>

              {/* Tabla del mes seleccionado (fila única) */}
              {mesSeleccionado && (
                <TablaReporte
                  meses={[mesSeleccionado]}
                  mostrarTotales={false}
                  titulo={`Detalle ${MESES[mes]} ${anio}`}
                />
              )}

              {(!mesSeleccionado || mesSeleccionado.nActividades === 0) && (
                <p className="text-center text-sm text-gray-400 py-6">
                  No hay actividades en {MESES[mes]} {anio}
                </p>
              )}
            </>
          )}

          {/* ——— Vista: AÑO COMPLETO ——— */}
          {verAnio && (
            <>
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <h2 className="text-base font-semibold text-gray-800">
                  Año {anio}
                  {vehiculoId && vehiculos && (
                    <span className="ml-2 text-sm font-normal text-gray-400">
                      · {vehiculos.find(v => v.id === vehiculoId)?.patente}
                    </span>
                  )}
                </h2>
                {data.totales.nActividades > 0 && (
                  <button
                    onClick={() => {
                      const patente = vehiculoId && vehiculos ? vehiculos.find(v => v.id === vehiculoId)?.patente : null
                      exportarPDF({
                        titulo: `Reporte anual ${anio}${patente ? ' · ' + patente : ''}`,
                        chips: [
                          { label: 'Km totales', value: `${NUM(data.totales.kmRecorridos)} km`, sub: `Año ${anio}` },
                          { label: 'Combustible', value: CLP(data.totales.montoCombustible), sub: `${NUM(Math.round(data.totales.litros * 10) / 10)} L cargados` },
                          { label: 'Peajes', value: CLP(data.totales.montoPeajes), sub: `Año ${anio}` },
                          { label: 'Actividades', value: NUM(data.totales.nActividades), sub: `Registros ${anio}` },
                        ],
                        meses: data.meses,
                        totales: data.totales,
                        mostrarTotales: true,
                      })
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors whitespace-nowrap"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a1 1 0 001 1h16a1 1 0 001-1v-3" />
                    </svg>
                    Exportar PDF
                  </button>
                )}
              </div>
              {/* Stats anuales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatChip
                  label="Km totales"
                  value={`${NUM(data.totales.kmRecorridos)} km`}
                  sub={`Año ${anio}`}
                />
                <StatChip
                  label="Combustible"
                  value={CLP(data.totales.montoCombustible)}
                  sub={`${NUM(Math.round(data.totales.litros * 10) / 10)} L cargados`}
                />
                <StatChip
                  label="Peajes"
                  value={CLP(data.totales.montoPeajes)}
                  sub={`Año ${anio}`}
                />
                <StatChip
                  label="Actividades"
                  value={NUM(data.totales.nActividades)}
                  sub={`Registros ${anio}`}
                />
              </div>

              <TablaReporte
                meses={data.meses}
                totales={data.totales}
                titulo={`Desglose mensual ${anio}${vehiculoId && vehiculos ? ' · ' + vehiculos.find(v => v.id === vehiculoId)?.patente : ''}`}
              />

              {data.meses.every(m => m.nActividades === 0) && (
                <p className="text-center text-sm text-gray-400 py-4">
                  No hay actividades registradas en {anio}
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
