// pages/flota/Vehiculos.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVehiculos, useDashboard } from '../../hooks/useFlota'
import NuevaActividad      from '../../components/flota/NuevaActividad'
import NuevoVehiculo       from '../../components/flota/NuevoVehiculo'
import DocumentosVehiculo  from '../../components/flota/DocumentosVehiculo'
import GastosTag           from '../../components/flota/GastosTag'
import api from '../../lib/api'

// ——— Cargar SheetJS una sola vez desde CDN ————————————————————
function loadSheetJS() {
  return new Promise((resolve, reject) => {
    if (window.XLSX) { resolve(window.XLSX); return }
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
    s.onload  = () => resolve(window.XLSX)
    s.onerror = () => reject(new Error('No se pudo cargar la librería Excel'))
    document.head.appendChild(s)
  })
}

// ——— Generar Excel con 3 hojas ————————————————————————————————
async function generarExcel({ filas, tenant, anio }) {
  const XLSX = await loadSheetJS()

  const wb = XLSX.utils.book_new()

  // ── Hoja 1: BASE_DATOS ──────────────────────────────────────────
  const encabezadoBase = [
    'Año', 'Mes', 'Región', 'Unidad', 'Patente',
    'KM Inicial', 'KM Final', 'Recorrido Mensual',
    'Tipo Combustible', 'Gasto Combustible ($)',
    'Gasto Peajes ($)', 'Gasto Seguros ($)',
    'Total Gasto ($)', 'Costo por KM ($)',
  ]
  const filasBase = filas.map(f => [
    f.anio, f.mes, f.region, f.unidad, f.patente,
    f.kmInicial, f.kmFinal, f.recorrido,
    f.tipoCombustible,
    f.gastoCombustible, f.gastoPeajes, f.gastoSeguros,
    f.totalGasto, f.costoKm,
  ])
  // Fila de totales
  const totalKm      = filas.reduce((s, f) => s + f.recorrido, 0)
  const totalComb    = filas.reduce((s, f) => s + f.gastoCombustible, 0)
  const totalPeajes  = filas.reduce((s, f) => s + f.gastoPeajes, 0)
  const totalSeguros = filas.reduce((s, f) => s + f.gastoSeguros, 0)
  const totalGasto   = filas.reduce((s, f) => s + f.totalGasto, 0)
  filasBase.push([
    '', 'TOTALES', '', '', '',
    '', '', totalKm,
    '', totalComb, totalPeajes, totalSeguros, totalGasto,
    totalKm > 0 ? Math.round(totalGasto / totalKm) : 0,
  ])

  const wsBase = XLSX.utils.aoa_to_sheet([encabezadoBase, ...filasBase])
  // Anchos de columna aproximados
  wsBase['!cols'] = [
    { wch: 6 }, { wch: 12 }, { wch: 12 }, { wch: 24 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 16 },
    { wch: 16 }, { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, wsBase, 'BASE_DATOS')

  // ── Hoja 2: Reporte_Transparencia ──────────────────────────────
  // Agrupar filas por mes
  const porMes = {}
  for (const f of filas) {
    if (!porMes[f.mes]) porMes[f.mes] = {
      mes: f.mes, vehiculos: new Set(), kmTotal: 0,
      combustible: 0, peajes: 0, seguros: 0,
    }
    const m = porMes[f.mes]
    m.vehiculos.add(f.patente)
    m.kmTotal      += f.recorrido
    m.combustible  += f.gastoCombustible
    m.peajes       += f.gastoPeajes
    m.seguros      += f.gastoSeguros
  }

  const titulo = 'Sistema Automatizado de Gestión de Flota y Reportabilidad de Transparencia'
  const encabezadoT = [
    'Año', 'Mes', 'N° Vehículos', 'KM Mensuales Recorridos',
    'Unidad Monetaria',
    'Monto Combustible ($)', 'Monto Peajes ($)', 'Monto Seguros ($)',
  ]
  const filasT = Object.values(porMes).map(m => [
    anio, m.mes, m.vehiculos.size, m.kmTotal,
    'Pesos', m.combustible, m.peajes, m.seguros,
  ])

  const datosT = [[titulo], [], encabezadoT, ...filasT]
  const wsT = XLSX.utils.aoa_to_sheet(datosT)
  wsT['!cols'] = [
    { wch: 6 }, { wch: 12 }, { wch: 14 }, { wch: 24 },
    { wch: 16 }, { wch: 22 }, { wch: 18 }, { wch: 18 },
  ]
  // Merge para el título (fila 0, columnas 0–7)
  wsT['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }]
  XLSX.utils.book_append_sheet(wb, wsT, 'Reporte_Transparencia')

  // ── Hoja 3: LISTAS_VALIDACION ───────────────────────────────────
  const anioActual = new Date().getFullYear()
  const anios   = [2024, 2025, 2026, 2027, 2028, 2029]
  const meses   = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
                   'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE']
  const combustibles = ['Bencina', 'Diesel']

  const maxRows = Math.max(anios.length, meses.length, combustibles.length)
  const filasL = [['Años', 'Meses', 'Tipo Combustible']]
  for (let i = 0; i < maxRows; i++) {
    filasL.push([anios[i] ?? '', meses[i] ?? '', combustibles[i] ?? ''])
  }
  const wsL = XLSX.utils.aoa_to_sheet(filasL)
  wsL['!cols'] = [{ wch: 8 }, { wch: 14 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, wsL, 'LISTAS_VALIDACION')

  // ── Descargar ────────────────────────────────────────────────────
  const nombre = `Flota_${tenant.nombre.replace(/\s+/g, '_')}_${anio}.xlsx`
  XLSX.writeFile(wb, nombre)
}

// ——— Modal generador de Excel ——————————————————————————————————
function ModalExcel({ onClose }) {
  const anioActual = new Date().getFullYear()
  const [anio,     setAnio]     = useState(anioActual)
  const [cargando, setCargando] = useState(false)
  const [err,      setErr]      = useState('')

  async function handleDescargar() {
    setCargando(true); setErr('')
    try {
      const r = await api.get(`/flota/reportes/datos?anio=${anio}`)
      const { filas, tenant } = r.data
      if (!filas.length) {
        setErr(`No hay registros de actividad para ${anio}.`)
        return
      }
      await generarExcel({ filas, tenant, anio })
      onClose()
    } catch (e) {
      setErr(e.message || 'Error al generar el reporte')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="bg-white border border-[#E1E4E8] rounded-2xl w-full max-w-sm shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E1E4E8]">
          <div>
            <div className="text-sm font-semibold text-[#252A31]">Reporte Excel</div>
            <div className="text-xs text-[#737B86]">Control de Flota — Base de datos y transparencia</div>
          </div>
          <button onClick={onClose} className="text-[#737B86] hover:text-[#252A31] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Info */}
          <div className="bg-[#F4F5F6] border border-[#E1E4E8] rounded-xl px-4 py-3 space-y-1.5 text-xs text-[#737B86]">
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-[#16A34A] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" /></svg>
              Hoja BASE_DATOS con km, combustible y peajes por vehículo
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-[#16A34A] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" /></svg>
              Hoja Reporte_Transparencia con resumen mensual
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-[#16A34A] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" /></svg>
              Hoja LISTAS_VALIDACION con años, meses y combustibles
            </div>
          </div>

          {/* Selector año */}
          <div>
            <label className="block text-xs font-semibold text-[#737B86] uppercase tracking-wide mb-2">Año del reporte</label>
            <select
              value={anio}
              onChange={e => setAnio(Number(e.target.value))}
              className="w-full bg-white border border-[#E1E4E8] rounded-lg px-3 py-2.5 text-sm text-[#252A31] focus:outline-none focus:border-amber-500"
            >
              {[anioActual - 1, anioActual, anioActual + 1].filter(a => a >= 2024).map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {err && (
            <div className="bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg px-3 py-2 text-sm text-[#DC2626]">{err}</div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-[#737B86] hover:text-[#252A31] transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleDescargar}
              disabled={cargando}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2 rounded-lg transition-colors"
            >
              {cargando ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Generando…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Descargar Excel
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ——— Modal asignar conductor ——————————————————————————————————
function ModalAsignarConductor({ vehiculo, onClose, onDone }) {
  const [conductores, setConductores] = useState([])
  const [selected,    setSelected]    = useState(vehiculo.conductorId ?? '')
  const [saving,      setSaving]      = useState(false)
  const [err,         setErr]         = useState('')

  useEffect(() => {
    api.get('/flota/conductores?activo=true')
      .then(r => setConductores(Array.isArray(r.data) ? r.data : (r.data?.data ?? [])))
      .catch(() => setErr('No se pudieron cargar los conductores'))
  }, [])

  async function handleGuardar() {
    setSaving(true); setErr('')
    try {
      await api.put(`/flota/vehiculos/${vehiculo.id}`, {
        conductorId: selected === '' ? null : selected,
      })
      onDone()
    } catch (error) {
      setErr(error.response?.data?.error || 'Error al asignar conductor')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="bg-white border border-[#E1E4E8] rounded-2xl w-full max-w-sm shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E1E4E8]">
          <div>
            <div className="text-sm font-semibold text-[#252A31]">Asignar conductor</div>
            <div className="text-xs text-[#737B86] font-mono">{vehiculo.patente} · {vehiculo.marca} {vehiculo.modelo}</div>
          </div>
          <button onClick={onClose} className="text-[#737B86] hover:text-[#252A31] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {err && (
            <div className="bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg px-3 py-2 text-sm text-[#DC2626]">
              {err}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#737B86] mb-2">Conductor asignado</label>
            <select
              value={selected}
              onChange={e => setSelected(e.target.value)}
              className="w-full bg-white border border-[#E1E4E8] rounded-lg px-3 py-2.5 text-sm text-[#252A31] focus:outline-none focus:border-amber-500"
            >
              <option value="">— Sin conductor —</option>
              {conductores.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}{c.rut ? ` · ${c.rut}` : ''}</option>
              ))}
            </select>
          </div>

          {selected && vehiculo.conductorId && selected !== vehiculo.conductorId && (
            <p className="text-xs text-[#D97706] bg-[#FEF3C7] border border-[#FCD34D] rounded-lg px-3 py-2">
              Se reemplazará el conductor actual.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-[#737B86] hover:text-[#252A31] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold text-sm px-5 py-2 rounded-lg transition-colors"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const ESTADOS = {
  OPERATIVO:         { label: 'Operativo',          color: 'text-[#16A34A] bg-[#DCFCE7] border-[#86EFAC]'  },
  EN_TALLER:         { label: 'En taller',           color: 'text-[#D97706] bg-[#FEF3C7] border-[#FCD34D]'  },
  FUERA_DE_SERVICIO: { label: 'Fuera de servicio',   color: 'text-[#DC2626] bg-[#FEE2E2] border-[#FCA5A5]'  },
}

export default function FlotaVehiculos() {
  const navigate = useNavigate()
  const [filters, setFilters]           = useState({ estado: '', search: '' })
  const [modalVehiculo,   setModalVehiculo]   = useState(null)
  const [modalNuevo,      setModalNuevo]      = useState(false)
  const [modalDocs,       setModalDocs]       = useState(null)
  const [modalAsignar,    setModalAsignar]    = useState(null) // vehiculo completo
  const [modalExcel,      setModalExcel]      = useState(false)
  const [modalTag,        setModalTag]        = useState(false)

  const { data: dash }                    = useDashboard()
  const { data, loading, error, refetch } = useVehiculos(filters)
  const vehiculos = data?.data ?? []

  function handleFilter(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  if (error) return (
    <div className="p-8 text-red-500 text-sm">Error al cargar vehículos: {error}</div>
  )

  return (
    <div className="p-7">

      {/* KPI chips */}
      {dash && (
        <div className="flex gap-3 mb-6 flex-wrap">
          <Chip label="Total"              value={dash.vehiculos.total}           />
          <Chip label="Operativos"         value={dash.vehiculos.operativos}      color="text-[#16A34A]" />
          <Chip label="En taller"          value={dash.vehiculos.enTaller}        color="text-[#D97706]" />
          <Chip label="Fuera de servicio"  value={dash.vehiculos.fueraDeServicio} color="text-[#DC2626]" />
          <Chip label="Sin conductor"      value={dash.vehiculos.sinConductor}    color="text-[#737B86]"  />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex gap-3 mb-5 flex-wrap items-center">
        <input
          type="text"
          placeholder="Buscar patente, marca…"
          value={filters.search}
          onChange={e => handleFilter('search', e.target.value)}
          className="bg-white border border-[#E1E4E8] rounded-lg px-3 py-2 text-sm text-[#252A31] placeholder-[#A0A6AE] outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 w-56"
        />
        <select
          value={filters.estado}
          onChange={e => handleFilter('estado', e.target.value)}
          className="bg-white border border-[#E1E4E8] rounded-lg px-3 py-2 text-sm text-[#252A31] outline-none focus:border-amber-500"
        >
          <option value="">Todos los estados</option>
          <option value="OPERATIVO">Operativo</option>
          <option value="EN_TALLER">En taller</option>
          <option value="FUERA_DE_SERVICIO">Fuera de servicio</option>
        </select>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setModalTag(true)}
            className="inline-flex items-center gap-2 bg-[#DBEAFE] hover:bg-blue-100 text-[#2563EB] border border-blue-200 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
              <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
            </svg>
            Gastos Tag
          </button>
          <button
            onClick={() => setModalExcel(true)}
            className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Excel
          </button>
          <button
            onClick={() => setModalNuevo(true)}
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            + Agregar vehículo
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-[#E1E4E8] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F4F5F6] border-b border-[#E5E7EB] text-xs text-[#737B86] font-semibold uppercase tracking-wide">
              <th className="text-left px-5 py-3">Vehículo</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-left px-4 py-3">Conductor</th>
              <th className="text-right px-4 py-3">Odómetro</th>
              <th className="text-left px-4 py-3">Próx. Mantención</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="text-center py-12 text-[#737B86]">Cargando…</td></tr>
            )}
            {!loading && vehiculos.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-[#737B86]">No se encontraron vehículos</td></tr>
            )}
            {vehiculos.map(v => (
              <VehiculoRow
                key={v.id}
                vehiculo={v}
                onVerFicha={() => navigate(`/flota/vehiculos/${v.id}`)}
                onNuevaActividad={() => setModalVehiculo({
                  id:    v.id,
                  patente: v.patente,
                  marca:   `${v.marca} ${v.modelo}`,
                  odometroActual: v.odometroActual,
                })}
                onDocumentos={() => setModalDocs({ id: v.id, patente: v.patente, marca: v.marca, modelo: v.modelo })}
                onAsignar={() => setModalAsignar(v)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {data?.total > 0 && (
        <p className="text-xs text-[#737B86] mt-3">{data.total} vehículos</p>
      )}

      {modalVehiculo && (
        <NuevaActividad
          vehiculo={modalVehiculo}
          onClose={() => setModalVehiculo(null)}
          onSuccess={() => { setModalVehiculo(null); refetch() }}
        />
      )}

      {modalNuevo && (
        <NuevoVehiculo
          onClose={() => setModalNuevo(false)}
          onSuccess={() => { setModalNuevo(false); refetch() }}
        />
      )}

      {modalDocs && (
        <DocumentosVehiculo
          vehiculo={modalDocs}
          onClose={() => setModalDocs(null)}
        />
      )}

      {modalAsignar && (
        <ModalAsignarConductor
          vehiculo={modalAsignar}
          onClose={() => setModalAsignar(null)}
          onDone={() => { setModalAsignar(null); refetch() }}
        />
      )}

      {modalExcel && (
        <ModalExcel onClose={() => setModalExcel(false)} />
      )}

      {modalTag && (
        <GastosTag onClose={() => setModalTag(false)} />
      )}
    </div>
  )
}

function VehiculoRow({ vehiculo: v, onVerFicha, onNuevaActividad, onDocumentos, onAsignar }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const estado = ESTADOS[v.estado] ?? ESTADOS.OPERATIVO

  // Estado mantención
  const hoy = new Date()
  let estadoMant = 'OK'
  if (v.proxMantencionFecha) {
    const diff = Math.ceil((new Date(v.proxMantencionFecha) - hoy) / 86400000)
    if (diff < 0) estadoMant = 'VENCIDA'
    else if (diff <= 30) estadoMant = 'PROXIMA'
  }
  if (v.proxMantencionKm) {
    const diffKm = v.proxMantencionKm - v.odometroActual
    if (diffKm <= 0) estadoMant = 'VENCIDA'
    else if (diffKm <= 1000 && estadoMant !== 'VENCIDA') estadoMant = 'PROXIMA'
  }

  return (
    <tr
      className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F4F5F6] transition-colors cursor-pointer"
      onClick={onVerFicha}
    >
      <td className="px-5 py-3">
        <div className="font-semibold text-[#252A31]">{v.marca} {v.modelo}</div>
        <div className="text-xs text-[#737B86] mt-0.5 font-mono tracking-wider">{v.patente} · {v.anio}</div>
        <div className="flex flex-wrap gap-x-2 mt-0.5">
          {v.categoria && <span className="text-xs text-[#A0A6AE]">{v.categoria}</span>}
          {v.region && <span className="text-xs text-[#A0A6AE]">{v.region}</span>}
          {v.unidadOperativa && <span className="text-xs text-[#A0A6AE]">{v.unidadOperativa}</span>}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${estado.color}`}>
          {estado.label}
        </span>
      </td>
      <td className="px-4 py-3" onClick={e => { e.stopPropagation(); onAsignar() }}>
        <button className={`inline-flex items-center gap-1.5 text-sm transition-colors group
          ${v.conductor ? 'text-[#252A31] hover:text-amber-500' : 'text-[#A0A6AE] italic hover:text-amber-500'}`}>
          {v.conductor ? (
            <>
              <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              {v.conductor.nombre}
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              Asignar
            </>
          )}
        </button>
      </td>
      <td className="px-4 py-3 text-right font-mono text-[#737B86]">
        {v.odometroActual.toLocaleString('es-CL')} km
      </td>
      {/* Próxima mantención */}
      <td className="px-4 py-3">
        {!v.proxMantencionFecha && !v.proxMantencionKm ? (
          <span className="text-[#A0A6AE] text-xs">—</span>
        ) : (
          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-md
            ${estadoMant === 'VENCIDA' ? 'bg-[#FEE2E2] text-[#DC2626]'
            : estadoMant === 'PROXIMA' ? 'bg-[#FEF3C7] text-[#D97706]'
            : 'bg-[#DCFCE7] text-[#16A34A]'}`}
          >
            {v.proxMantencionFecha
              ? new Date(v.proxMantencionFecha).toLocaleDateString('es-CL', { day:'2-digit', month:'2-digit', year:'2-digit' })
              : `${Number(v.proxMantencionKm).toLocaleString('es-CL')} km`}
          </span>
        )}
      </td>
      {/* Menú contextual (3 puntos) */}
      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
        <div className="relative flex justify-end">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="p-1.5 rounded-lg text-[#737B86] hover:text-[#252A31] hover:bg-[#ECEEF1] transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
            </svg>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-44 bg-white border border-[#E1E4E8] rounded-xl shadow-lg py-1 overflow-hidden">
                <MenuItem label="Ver ficha" onClick={() => { setMenuOpen(false); onVerFicha() }} />
                <MenuItem label="+ Actividad" onClick={() => { setMenuOpen(false); onNuevaActividad() }} />
                <MenuItem label="Documentos" onClick={() => { setMenuOpen(false); onDocumentos() }} />
                <MenuItem label="Cambiar conductor" onClick={() => { setMenuOpen(false); onAsignar() }} />
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

function MenuItem({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-2 text-sm text-[#252A31] hover:bg-[#F4F5F6] transition-colors"
    >
      {label}
    </button>
  )
}

function Chip({ label, value, color = 'text-[#252A31]' }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-[#E1E4E8] rounded-xl">
      <span className="text-xs text-[#737B86]">{label}</span>
      <span className={`text-lg font-bold leading-none ${color}`}>{value ?? '—'}</span>
    </div>
  )
}
