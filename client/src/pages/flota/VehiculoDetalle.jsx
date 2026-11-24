// pages/flota/VehiculoDetalle.jsx
// Ficha completa de un vehículo: stats del mes, historial de actividades, documentos.

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import api from '../../lib/api'
import { getUsuario } from '../../lib/auth'
import NuevaActividad     from '../../components/flota/NuevaActividad'
import DocumentosVehiculo from '../../components/flota/DocumentosVehiculo'

// ——— Helpers ——————————————————————————————————————————————————
const FMT  = n => n != null ? `$${Number(n).toLocaleString('es-CL')}` : '—'
const REGIONES_CHILE = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
  'Valparaíso', 'Metropolitana de Santiago', "O'Higgins", 'Maule',
  'Ñuble', 'Biobío', 'La Araucanía', 'Los Ríos', 'Los Lagos',
  'Aysén', 'Magallanes',
]

const KM   = n => n != null ? `${Number(n).toLocaleString('es-CL')} km` : '—'
const FECHA = iso => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
}
const FECHA_CORTA = iso => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
}
const HORA = iso => {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

const ESTADOS = {
  OPERATIVO:         { label: 'Operativo',          color: 'text-[#16A34A] bg-[#DCFCE7] border-[#86EFAC]' },
  EN_TALLER:         { label: 'En taller',           color: 'text-[#D97706] bg-[#FEF3C7] border-[#FCD34D]' },
  FUERA_DE_SERVICIO: { label: 'Fuera de servicio',   color: 'text-[#DC2626] bg-[#FEE2E2] border-[#FCA5A5]' },
}

const TIPO_ICON = {
  KILOMETRAJE: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
    </svg>
  ),
  COMBUSTIBLE: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M3 22V7a2 2 0 012-2h8a2 2 0 012 2v15M13 7h2a2 2 0 012 2v3l2 1v4" /><rect x="6" y="10" width="5" height="4" rx="1" />
    </svg>
  ),
  PEAJE: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  MANTENCION: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  CAMBIO_ESTADO: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" />
      <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  ),
  TRASLADO: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
}

const TIPO_COLOR = {
  KILOMETRAJE:   'text-[#737B86]  bg-[#F4F5F6]',
  COMBUSTIBLE:   'text-[#16A34A] bg-[#DCFCE7]',
  PEAJE:         'text-blue-500  bg-blue-50',
  MANTENCION:    'text-[#D97706] bg-[#FEF3C7]',
  CAMBIO_ESTADO: 'text-purple-600 bg-purple-50',
  TRASLADO:      'text-sky-600    bg-sky-50',
}

const TIPO_LABEL = {
  KILOMETRAJE:   'Kilometraje',
  COMBUSTIBLE:   'Combustible',
  PEAJE:         'Peaje',
  MANTENCION:    'Mantención',
  CAMBIO_ESTADO: 'Estado',
  TRASLADO:      'Traslado',
}

const SENTIDO_LABEL = { IDA: 'Ida', VUELTA: 'Vuelta', IDA_Y_VUELTA: 'Ida y vuelta' }

// ——— Tabs ————————————————————————————————————————————————————
const TABS = [
  { key: 'resumen',     label: 'Resumen'     },
  { key: 'combustible', label: 'Combustible' },
  { key: 'traslados',   label: 'Traslados'   },
  { key: 'documentos',  label: 'Documentos'  },
  { key: 'costos',      label: 'Costos'      },
]

// ——— Componente principal ——————————————————————————————————————
export default function VehiculoDetalle() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const location   = useLocation()

  const [vehiculo,  setVehiculo]  = useState(null)
  const [stats,     setStats]     = useState(null)
  const [actividades, setActividades] = useState([])
  const [total,     setTotal]     = useState(0)
  const [page,      setPage]      = useState(1)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [loading,   setLoading]   = useState(true)
  const [loadingActs, setLoadingActs] = useState(false)
  const [error,     setError]     = useState('')
  const [tab,       setTab]       = useState('resumen')

  const [modalActividad,  setModalActividad]  = useState(false)
  const [modalDocs,       setModalDocs]       = useState(false)
  const [modalEditar,     setModalEditar]     = useState(false)
  const [modalEditComb,   setModalEditComb]   = useState(null)
  const [modalRecarga,    setModalRecarga]    = useState(false)
  const [modalLlegada,    setModalLlegada]    = useState(null)  // { actId, kmSalida, destino }
  const [kmLlegadaInput,  setKmLlegadaInput]  = useState('')
  const [savingLlegada,   setSavingLlegada]   = useState(false)
  const [errorLlegada,    setErrorLlegada]    = useState('')

  const usuario = getUsuario()
  const esAdmin = usuario?.rol === 'admin' || usuario?.rol === 'superadmin'

  const hoyMes = new Date().toISOString().slice(0, 7)

  // Cargar datos del vehículo y stats
  const cargarVehiculo = useCallback(async () => {
    try {
      const [vRes, sRes] = await Promise.all([
        api.get(`/flota/vehiculos/${id}`),
        api.get(`/flota/vehiculos/${id}/estadisticas?mes=${hoyMes}`),
      ])
      setVehiculo(vRes.data)
      setStats(sRes.data)
    } catch {
      setError('No se pudo cargar el vehículo')
    } finally {
      setLoading(false)
    }
  }, [id, hoyMes])

  // Cargar historial de actividades
  const cargarActividades = useCallback(async (p = 1, tipo = '') => {
    setLoadingActs(true)
    try {
      const qs = new URLSearchParams({ page: p, limit: 15, ...(tipo ? { tipo } : {}) }).toString()
      const res = await api.get(`/flota/vehiculos/${id}/actividades?${qs}`)
      if (p === 1) {
        setActividades(res.data.data)
      } else {
        setActividades(prev => [...prev, ...res.data.data])
      }
      setTotal(res.data.total)
      setPage(p)
    } catch {
      // silencioso
    } finally {
      setLoadingActs(false)
    }
  }, [id])

  useEffect(() => { cargarVehiculo() }, [cargarVehiculo])
  useEffect(() => { cargarActividades(1, filtroTipo) }, [cargarActividades, filtroTipo])

  const eliminarActividad = useCallback(async (actId) => {
    await api.delete(`/flota/actividades/${actId}`)
    await cargarActividades(1, filtroTipo)
  }, [cargarActividades, filtroTipo])

  const completarLlegada = useCallback(async () => {
    if (!modalLlegada) return
    const km = Number(kmLlegadaInput)
    if (!km || km <= 0) { setErrorLlegada('Ingresa un odómetro válido'); return }
    if (modalLlegada.kmSalida && km <= modalLlegada.kmSalida) {
      setErrorLlegada(`Debe ser mayor al km de salida (${modalLlegada.kmSalida.toLocaleString('es-CL')} km)`)
      return
    }
    setSavingLlegada(true)
    setErrorLlegada('')
    try {
      await api.patch(`/flota/actividades/${modalLlegada.actId}/llegada`, { kmLlegada: km })
      setModalLlegada(null)
      setKmLlegadaInput('')
      await cargarActividades(1, filtroTipo)
      await cargarVehiculo()
    } catch (e) {
      setErrorLlegada(e?.response?.data?.error || 'Error al guardar')
    } finally {
      setSavingLlegada(false)
    }
  }, [modalLlegada, kmLlegadaInput, cargarActividades, cargarVehiculo, filtroTipo])

  // Abrir modal de documentos automáticamente si viene con ?docs=1
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('docs') === '1') {
      setModalDocs(true)
      // Limpiar el query param sin recargar
      navigate(location.pathname, { replace: true })
    }
  }, [location.search, location.pathname, navigate])

  // Sincronizar filtro al cambiar de tab
  useEffect(() => {
    if (tab === 'combustible') setFiltroTipo('COMBUSTIBLE')
    else if (tab === 'traslados') setFiltroTipo('TRASLADO')
    else if (['resumen', 'costos'].includes(tab)) setFiltroTipo('')
  }, [tab])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#737B86] text-sm">
        Cargando…
      </div>
    )
  }

  if (error || !vehiculo) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <p className="text-[#DC2626] text-sm">{error || 'Vehículo no encontrado'}</p>
        <button onClick={() => navigate('/flota/vehiculos')} className="btn-ghost text-xs">
          ← Volver a vehículos
        </button>
      </div>
    )
  }

  const estado = ESTADOS[vehiculo.estado] ?? ESTADOS.OPERATIVO

  // Estado mantención (para el tab de Mantenciones)
  let estadoMant = 'OK'
  if (vehiculo.proxMantencionFecha) {
    const diff = Math.ceil((new Date(vehiculo.proxMantencionFecha) - new Date()) / 86400000)
    if (diff < 0) estadoMant = 'VENCIDA'
    else if (diff <= 30) estadoMant = 'PROXIMA'
  }
  if (vehiculo.proxMantencionKm) {
    const diff = vehiculo.proxMantencionKm - (vehiculo.odometroActual ?? 0)
    if (diff <= 0) estadoMant = 'VENCIDA'
    else if (diff <= 1000 && estadoMant !== 'VENCIDA') estadoMant = 'PROXIMA'
  }

  const mantBadgeStyle = {
    OK:      'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]',
    PROXIMA: 'bg-[#FEF3C7] text-[#D97706] border-[#FCD34D]',
    VENCIDA: 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]',
  }[estadoMant]

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-0 pb-10">

      {/* ── Botón volver ── */}
      <button
        onClick={() => navigate('/flota/vehiculos')}
        className="flex items-center gap-2 text-sm font-semibold text-[#4B5563] bg-white border border-[#D1D5DB] hover:border-[#9CA3AF] hover:text-[#252A31] transition-colors w-fit mb-5 px-3 py-2 rounded-lg shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Volver a vehículos
      </button>

      {/* ── Header del vehículo ── */}
      <div className="bg-white border border-[#E1E4E8] rounded-2xl p-5 mb-4">
        <div className="flex items-start gap-4 flex-wrap">

          {/* Icono */}
          <div className="w-14 h-14 rounded-xl bg-[#F4F5F6] border border-[#E1E4E8] flex items-center justify-center flex-shrink-0">
            <svg className="w-7 h-7 text-[#A0A6AE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h1l3-4h8l3 4h1a2 2 0 012 2v6a2 2 0 01-2 2h-2" />
              <circle cx="7.5" cy="17.5" r="2.5" /><circle cx="16.5" cy="17.5" r="2.5" />
            </svg>
          </div>

          {/* Info principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-[#252A31]">
                {vehiculo.marca} {vehiculo.modelo}
              </h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${estado.color}`}>
                {estado.label}
              </span>
              {vehiculo.tieneTag && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-blue-200 bg-blue-50 text-blue-600">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                    <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
                  </svg>
                  Tag activo
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 flex-wrap">
              <span className="font-mono text-sm text-[#252A31] tracking-widest">{vehiculo.patente}</span>
              <span className="text-[#737B86] text-sm">{vehiculo.anio}</span>
              {vehiculo.categoria && <span className="text-[#737B86] text-sm">{vehiculo.categoria}</span>}
              {vehiculo.color && <span className="text-[#737B86] text-sm">{vehiculo.color}</span>}
              {vehiculo.numeroInterno && <span className="text-xs bg-[#F4F5F6] text-[#737B86] px-2 py-0.5 rounded font-mono border border-[#E1E4E8]">#{vehiculo.numeroInterno}</span>}
              {vehiculo.region && <span className="text-xs text-[#737B86]">{vehiculo.region}</span>}
              {vehiculo.unidadOperativa && <span className="text-xs text-[#737B86]">{vehiculo.unidadOperativa}</span>}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2 flex-shrink-0 flex-wrap">
            {esAdmin && (
              <button
                onClick={() => setModalEditar(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-[#E1E4E8] bg-white text-[#737B86] hover:text-[#252A31] hover:border-[#C6CAD0] transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Editar
              </button>
            )}
            <button
              onClick={() => setModalActividad(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="M12 5v14M5 12h14" />
              </svg>
              Nueva actividad
            </button>
          </div>
        </div>

        {/* Segunda fila: conductor + odómetro + próxima mantención */}
        <div className="mt-4 pt-4 border-t border-[#E5E7EB] grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoItem
            label="Conductor"
            value={vehiculo.conductor?.nombre || <span className="text-[#A0A6AE] italic">Sin asignar</span>}
          />
          <InfoItem label="Odómetro actual" value={KM(vehiculo.odometroActual)} />
          <InfoItem
            label="Próx. mantención km"
            value={vehiculo.proxMantencionKm ? KM(vehiculo.proxMantencionKm) : '—'}
            alert={vehiculo.proxMantencionKm && vehiculo.odometroActual >= vehiculo.proxMantencionKm - 500}
          />
          <InfoItem
            label="Próx. mantención fecha"
            value={FECHA(vehiculo.proxMantencionFecha)}
            alert={vehiculo.proxMantencionFecha && new Date(vehiculo.proxMantencionFecha) <= new Date(Date.now() + 7 * 86400000)}
          />
        </div>

        {/* Documentos vencidos */}
        {vehiculo.documentos?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {vehiculo.documentos.map(doc => {
              const venc  = new Date(doc.fechaVencimiento)
              const hoy   = new Date()
              const diff  = Math.round((venc - hoy) / 86400000)
              const vencido   = diff < 0
              const porVencer = !vencido && diff <= 30
              if (!vencido && !porVencer) return null
              return (
                <span
                  key={doc.id}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border
                    ${vencido
                      ? 'text-[#DC2626] bg-[#FEE2E2] border-[#FCA5A5]'
                      : 'text-[#D97706] bg-[#FEF3C7] border-[#FCD34D]'}`}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  {DOC_LABEL[doc.tipo] || doc.tipo} {vencido ? `vencido ${FECHA_CORTA(doc.fechaVencimiento)}` : `vence ${FECHA_CORTA(doc.fechaVencimiento)}`}
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-0 border-b border-[#E5E7EB] mb-5 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors
              ${tab === t.key
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-[#737B86] hover:text-[#252A31]'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ Tab: Resumen ══ */}
      {tab === 'resumen' && (
        <div className="flex flex-col gap-5">
          {/* Stats del mes */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Gasto total"   value={FMT(stats.gastoTotal)}       color="total" />
              <StatCard label="Combustible"   value={FMT(stats.gastoCombustible)} color="combustible" sub={stats.litrosTotales ? `${Number(stats.litrosTotales).toFixed(1)} L cargados` : 'Sin registros'} />
              <StatCard label="Peajes"        value={FMT(stats.gastoPeajes)}      color="peajes" />
              <StatCard label="Km recorridos" value={stats.kmRecorridos > 0 ? KM(stats.kmRecorridos) : '—'} color="km" />
            </div>
          )}

          {/* Próxima mantención destacada */}
          {(vehiculo.proxMantencionFecha || vehiculo.proxMantencionKm) && (
            <div className={`flex items-center gap-4 p-4 rounded-xl border ${mantBadgeStyle} flex-wrap`}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
              </svg>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider">Próxima mantención</div>
                <div className="flex items-center gap-4 mt-1 flex-wrap text-xs">
                  {vehiculo.proxMantencionFecha && (
                    <span>Fecha: <strong>{FECHA(vehiculo.proxMantencionFecha)}</strong></span>
                  )}
                  {vehiculo.proxMantencionKm && (
                    <span>Km: <strong>{KM(vehiculo.proxMantencionKm)}</strong></span>
                  )}
                  {vehiculo.proxMantencionKm && vehiculo.odometroActual != null && (
                    <span className="opacity-70">
                      ({vehiculo.proxMantencionKm - vehiculo.odometroActual > 0
                        ? `faltan ${(vehiculo.proxMantencionKm - vehiculo.odometroActual).toLocaleString('es-CL')} km`
                        : `excedido por ${(vehiculo.odometroActual - vehiculo.proxMantencionKm).toLocaleString('es-CL')} km`})
                    </span>
                  )}
                </div>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${mantBadgeStyle}`}>
                {estadoMant === 'OK' ? 'Al día' : estadoMant === 'PROXIMA' ? 'Próxima' : 'Vencida'}
              </span>
            </div>
          )}

          {/* Actividad reciente */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#737B86] uppercase tracking-wider">
                Actividad reciente
              </span>
            </div>
            {loadingActs && actividades.length === 0 && (
              <div className="flex items-center justify-center py-10 text-[#737B86] text-sm">Cargando…</div>
            )}
            {!loadingActs && actividades.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center bg-white border border-[#E1E4E8] rounded-xl">
                <p className="text-[#737B86] text-sm">Sin actividades registradas</p>
                <button onClick={() => setModalActividad(true)} className="mt-3 text-xs text-amber-600 hover:text-amber-700 font-semibold">
                  + Registrar primera actividad
                </button>
              </div>
            )}
            {actividades.length > 0 && (() => {
              // Agrupar por fecha (día)
              const grupos = []
              let diaActual = null
              actividades.slice(0, 10).forEach(act => {
                const dia = new Date(act.fecha).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
                if (dia !== diaActual) {
                  diaActual = dia
                  grupos.push({ dia, actos: [] })
                }
                grupos[grupos.length - 1].actos.push(act)
              })
              return (
                <div className="flex flex-col gap-3">
                  {grupos.map(({ dia, actos }) => (
                    <div key={dia}>
                      <div className="text-xs font-semibold text-[#A0A6AE] uppercase tracking-wider px-1 mb-1.5 capitalize">
                        {dia}
                      </div>
                      <div className="bg-white border border-[#E1E4E8] rounded-xl overflow-hidden">
                        <div className="divide-y divide-[#E5E7EB]">
                          {actos.map(act => (
                            <ActividadRow
                              key={act.id}
                              actividad={act}
                              esAdmin={esAdmin}
                              onEditComb={esAdmin && act.tipo === 'COMBUSTIBLE' ? () => setModalEditComb(act) : null}
                              onDelete={esAdmin ? () => eliminarActividad(act.id) : null}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* ══ Tab: Combustible ══ */}
      {tab === 'combustible' && (
        <div className="flex flex-col gap-5">
          {/* Saldo cupón electrónico */}
          {vehiculo.saldoCupon > 0 || esAdmin ? (
            <div className={`flex items-center justify-between gap-4 rounded-xl border px-5 py-4 ${
              vehiculo.saldoCupon <= 0
                ? 'bg-[#F9FAFB] border-[#E1E4E8]'
                : vehiculo.saldoCupon < 20000
                  ? 'bg-red-50 border-red-200'
                  : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">🎫</span>
                <div>
                  <div className="text-xs font-semibold text-[#737B86] uppercase tracking-wider">Saldo cupón electrónico</div>
                  <div className={`text-lg font-bold mt-0.5 font-mono ${
                    vehiculo.saldoCupon <= 0
                      ? 'text-[#A0A6AE]'
                      : vehiculo.saldoCupon < 20000
                        ? 'text-red-600'
                        : 'text-green-700'
                  }`}>
                    {FMT(vehiculo.saldoCupon)}
                  </div>
                  {vehiculo.saldoCupon > 0 && vehiculo.saldoCupon < 20000 && (
                    <div className="text-xs text-red-500 mt-0.5">Saldo bajo</div>
                  )}
                </div>
              </div>
              {esAdmin && (
                <button
                  onClick={() => setModalRecarga(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-green-200 bg-white text-green-700 hover:bg-green-50 transition-colors whitespace-nowrap"
                >
                  + Recargar
                </button>
              )}
            </div>
          ) : null}

          {/* Resumen del mes */}
          {stats && (
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Gasto combustible" value={FMT(stats.gastoCombustible)} icon="⛽" />
              <StatCard label="Litros totales"    value={stats.litrosTotales ? `${Number(stats.litrosTotales).toFixed(1)} L` : '—'} icon="📊" />
              <StatCard
                label="Precio promedio / L"
                value={stats.gastoCombustible && stats.litrosTotales && Number(stats.litrosTotales) > 0
                  ? `$${Math.round(stats.gastoCombustible / Number(stats.litrosTotales)).toLocaleString('es-CL')}`
                  : '—'}
                icon="💲"
              />
            </div>
          )}

          {/* Historial cargas */}
          <div>
            <div className="text-xs font-semibold text-[#737B86] uppercase tracking-wider mb-3">
              Historial de cargas
              {total > 0 && <span className="ml-2 text-[#A0A6AE] normal-case font-normal">{total} registros</span>}
            </div>
            {loadingActs && actividades.length === 0 && (
              <div className="flex items-center justify-center py-12 text-[#737B86] text-sm">Cargando…</div>
            )}
            {!loadingActs && actividades.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center bg-white border border-[#E1E4E8] rounded-xl">
                <p className="text-[#737B86] text-sm">Sin cargas de combustible registradas</p>
                <button onClick={() => setModalActividad(true)} className="mt-3 text-xs text-amber-600 hover:text-amber-700 font-semibold">
                  + Registrar carga
                </button>
              </div>
            )}
            {actividades.length > 0 && (
              <div className="bg-white border border-[#E1E4E8] rounded-xl overflow-hidden">
                <div className="divide-y divide-[#E5E7EB]">
                  {actividades.map(act => (
                    <ActividadRow
                      key={act.id}
                      actividad={act}
                      esAdmin={esAdmin}
                      onEditComb={esAdmin ? () => setModalEditComb(act) : null}
                      onDelete={esAdmin ? () => eliminarActividad(act.id) : null}
                    />
                  ))}
                </div>
                {actividades.length < total && (
                  <div className="px-5 py-3 border-t border-[#E5E7EB] text-center">
                    <button onClick={() => cargarActividades(page + 1, 'COMBUSTIBLE')} disabled={loadingActs}
                      className="text-xs text-[#737B86] hover:text-[#252A31] font-semibold disabled:opacity-50 transition-colors">
                      {loadingActs ? 'Cargando…' : `Cargar más (${total - actividades.length} restantes)`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ Tab: Documentos ══ */}
      {tab === 'documentos' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#737B86] uppercase tracking-wider">
              Documentos del vehículo
            </span>
            <button
              onClick={() => setModalDocs(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M12 5v14M5 12h14" />
              </svg>
              Administrar documentos
            </button>
          </div>

          {(!vehiculo.documentos || vehiculo.documentos.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white border border-[#E1E4E8] rounded-xl gap-3">
              <svg className="w-10 h-10 text-[#C6CAD0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-[#737B86] text-sm">Sin documentos registrados</p>
              <button onClick={() => setModalDocs(true)} className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                + Agregar documentos
              </button>
            </div>
          ) : (
            <div className="bg-white border border-[#E1E4E8] rounded-xl overflow-hidden">
              <div className="divide-y divide-[#E5E7EB]">
                {vehiculo.documentos.map(doc => {
                  const venc       = doc.fechaVencimiento ? new Date(doc.fechaVencimiento) : null
                  const hoy        = new Date()
                  const diff       = venc ? Math.round((venc - hoy) / 86400000) : null
                  const vencido    = diff !== null && diff < 0
                  const porVencer  = diff !== null && !vencido && diff <= 30
                  const estadoDoc  = vencido ? 'VENCIDO' : porVencer ? 'PRÓXIMO' : 'VIGENTE'
                  const docStyles  = {
                    VENCIDO: 'text-[#DC2626]',
                    PRÓXIMO: 'text-[#D97706]',
                    VIGENTE: 'text-[#16A34A]',
                  }[estadoDoc]

                  return (
                    <div key={doc.id} className="flex items-center gap-4 px-5 py-3.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[#252A31]">
                          {DOC_LABEL[doc.tipo] || doc.tipo?.replace(/_/g, ' ')}
                        </div>
                        <div className="text-xs text-[#737B86] mt-0.5">
                          {venc ? `Vence: ${FECHA(doc.fechaVencimiento)}` : 'Sin fecha de vencimiento'}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {estadoDoc !== 'VIGENTE' && (
                          <span className={`text-xs font-bold ${docStyles}`}>{estadoDoc}</span>
                        )}
                        {diff !== null && diff >= 0 && (
                          <span className={`text-xs ${docStyles}`}>
                            {diff === 0 ? 'Vence hoy' : `${diff}d`}
                          </span>
                        )}
                        {doc.archivoBase64 && (
                          <a
                            href={`data:application/pdf;base64,${doc.archivoBase64}`}
                            download={doc.archivoNombre || `${doc.tipo}.pdf`}
                            onClick={e => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs text-[#737B86] hover:text-[#252A31] transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3" />
                            </svg>
                            PDF
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ Tab: Traslados ══ */}
      {tab === 'traslados' && (
        <div className="flex flex-col gap-4">
          <div className="text-xs font-semibold text-[#737B86] uppercase tracking-wider">
            Historial de traslados
          </div>

          {actividades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#A0A6AE]">
              <span className="text-3xl">🚗</span>
              <span className="text-sm">Sin traslados registrados</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {actividades.map(act => {
                const t = act.trasladoRegistro
                if (!t) return null
                const kmRec = t.kmSalida != null && t.kmLlegada != null
                  ? t.kmLlegada - t.kmSalida
                  : null
                const pendiente = t.kmSalida != null && t.kmLlegada == null
                return (
                  <div key={act.id} className={`bg-white rounded-xl border p-4 ${pendiente ? 'border-amber-300' : 'border-[#E1E4E8]'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-[#252A31] truncate">
                            {t.destino}
                          </span>
                          {pendiente ? (
                            <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full whitespace-nowrap font-semibold">
                              En curso
                            </span>
                          ) : kmRec != null ? (
                            <span className="text-xs bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full whitespace-nowrap font-medium">
                              {KM(kmRec)}
                            </span>
                          ) : null}
                        </div>
                        {t.motivo && (
                          <span className="text-xs text-[#737B86]">{t.motivo}</span>
                        )}
                        <div className="flex items-center gap-3 text-xs text-[#A0A6AE] flex-wrap mt-0.5">
                          {t.kmSalida != null && (
                            <span>Salida: {t.kmSalida.toLocaleString('es-CL')} km</span>
                          )}
                          {t.kmLlegada != null && (
                            <span>Llegada: {t.kmLlegada.toLocaleString('es-CL')} km</span>
                          )}
                          {act.conductor && (
                            <span>· {act.conductor.nombre}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <div className="text-xs text-[#A0A6AE] whitespace-nowrap">
                          {new Date(act.fecha).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        {pendiente && (
                          <button
                            onClick={() => { setModalLlegada({ actId: act.id, kmSalida: t.kmSalida, destino: t.destino }); setKmLlegadaInput(''); setErrorLlegada('') }}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-400 transition-colors whitespace-nowrap"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Registrar llegada
                          </button>
                        )}
                        {esAdmin && (
                          <button
                            onClick={() => eliminarActividad(act.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 hover:border-red-300 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Cargar más */}
          {actividades.length < total && (
            <div className="flex justify-center pt-2">
              <button onClick={() => cargarActividades(page + 1, 'TRASLADO')}
                disabled={loadingActs}
                className="px-4 py-1.5 text-xs rounded-lg border border-[#E1E4E8] bg-white text-[#252A31] hover:bg-[#F5F6F7] disabled:opacity-40">
                {loadingActs ? 'Cargando…' : 'Cargar más'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══ Tab: Costos ══ */}
      {tab === 'costos' && (
        <div className="flex flex-col gap-5">
          <div className="text-xs font-semibold text-[#737B86] uppercase tracking-wider">
            Resumen de costos — {new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
          </div>

          {stats ? (
            <>
              {/* Tarjetas principales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Total del mes" value={FMT(stats.gastoTotal)}        icon="💰" />
                <StatCard label="Combustible"   value={FMT(stats.gastoCombustible)}  icon="⛽" />
                <StatCard label="Peajes"        value={FMT(stats.gastoPeajes)}       icon="🏷️" />
                <StatCard label="Mantenciones"  value={FMT(stats.gastoMantencion)}   icon="🔧" />
              </div>

              {/* Desglose visual */}
              <div className="bg-white border border-[#E1E4E8] rounded-xl p-5">
                <div className="text-xs font-semibold text-[#737B86] mb-4">Distribución de costos</div>
                {stats.gastoTotal > 0 ? (
                  <div className="space-y-3">
                    {[
                      { label: 'Combustible',   value: stats.gastoCombustible || 0,  color: 'bg-[#16A34A]'  },
                      { label: 'Mantenciones',  value: stats.gastoMantencion  || 0,  color: 'bg-amber-400'  },
                      { label: 'Peajes',        value: stats.gastoPeajes      || 0,  color: 'bg-blue-400'   },
                    ].map(item => {
                      const pct = stats.gastoTotal > 0 ? Math.round((item.value / stats.gastoTotal) * 100) : 0
                      return (
                        <div key={item.label}>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                              <span className="text-[#252A31]">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[#737B86]">{pct}%</span>
                              <span className="text-[#252A31] font-semibold font-mono w-24 text-right">{FMT(item.value)}</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-[#F4F5F6] rounded-full overflow-hidden">
                            <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                    <div className="pt-3 border-t border-[#E1E4E8] flex justify-between">
                      <span className="text-xs text-[#737B86] font-semibold uppercase tracking-wide">Total</span>
                      <span className="text-sm font-bold text-[#252A31] font-mono">{FMT(stats.gastoTotal)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[#737B86]">Sin costos registrados este mes</p>
                )}
              </div>

              {/* Km del mes */}
              {stats.kmRecorridos > 0 && stats.gastoTotal > 0 && (
                <div className="bg-white border border-[#E1E4E8] rounded-xl p-5">
                  <div className="text-xs font-semibold text-[#737B86] mb-3">Eficiencia del mes</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-[#A0A6AE]">Km recorridos</div>
                      <div className="text-lg font-bold text-[#252A31] mt-0.5">{KM(stats.kmRecorridos)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#A0A6AE]">Costo por km</div>
                      <div className="text-lg font-bold text-[#252A31] mt-0.5">
                        {stats.kmRecorridos > 0
                          ? `$${Math.round(stats.gastoTotal / stats.kmRecorridos).toLocaleString('es-CL')}/km`
                          : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center py-12 text-[#737B86] text-sm">
              Sin datos de costos disponibles
            </div>
          )}
        </div>
      )}

      {/* ── Modales ── */}
      {modalActividad && (
        <NuevaActividad
          vehiculo={vehiculo}
          onClose={() => setModalActividad(false)}
          onSuccess={async () => {
            setModalActividad(false)
            await Promise.all([cargarVehiculo(), cargarActividades(1, filtroTipo)])
          }}
        />
      )}
      {modalDocs && (
        <DocumentosVehiculo
          vehiculo={vehiculo}
          onClose={() => { setModalDocs(false); cargarVehiculo() }}
        />
      )}
      {modalEditar && (
        <EditarVehiculo
          vehiculo={vehiculo}
          onClose={() => setModalEditar(false)}
          onSuccess={v => { setVehiculo(v); setModalEditar(false) }}
        />
      )}
      {modalEditComb && (
        <EditarCombustible
          actividad={modalEditComb}
          vehiculoId={id}
          onClose={() => setModalEditComb(null)}
          onSuccess={() => { setModalEditComb(null); cargarActividades(1, filtroTipo) }}
        />
      )}
      {modalRecarga && (
        <RecargaCupon
          vehiculo={vehiculo}
          onClose={() => setModalRecarga(false)}
          onSuccess={v => { setVehiculo(v); setModalRecarga(false) }}
        />
      )}

      {/* Modal: completar km llegada */}
      {modalLlegada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#252A31]">Registrar llegada</h3>
                <p className="text-xs text-[#737B86] mt-0.5">{modalLlegada.destino}</p>
              </div>
              <button onClick={() => setModalLlegada(null)} className="text-[#A0A6AE] hover:text-[#252A31] transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#252A31]">Odómetro de llegada (km)</label>
              {modalLlegada.kmSalida != null && (
                <p className="text-xs text-[#A0A6AE]">Salida: {modalLlegada.kmSalida.toLocaleString('es-CL')} km</p>
              )}
              <input
                type="number"
                value={kmLlegadaInput}
                onChange={e => { setKmLlegadaInput(e.target.value); setErrorLlegada('') }}
                onKeyDown={e => e.key === 'Enter' && completarLlegada()}
                placeholder={modalLlegada.kmSalida ? `Mayor a ${modalLlegada.kmSalida.toLocaleString('es-CL')}` : 'Ej: 197500'}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E1E4E8] text-sm text-[#252A31] focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                autoFocus
              />
              {errorLlegada && (
                <p className="text-xs text-red-500">{errorLlegada}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setModalLlegada(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E1E4E8] text-sm text-[#737B86] hover:bg-[#F5F6F7] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={completarLlegada}
                disabled={savingLlegada || !kmLlegadaInput}
                className="flex-1 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-sm font-semibold text-white transition-colors disabled:opacity-50"
              >
                {savingLlegada ? 'Guardando…' : 'Guardar llegada'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ——— Fila de actividad ———————————————————————————————————————
function ActividadRow({ actividad: act, onEditComb, onDelete }) {
  const [expandido, setExpandido] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  const colorCls = TIPO_COLOR[act.tipo] || 'text-[#737B86] bg-[#F4F5F6]'
  const resumen  = buildResumen(act)

  return (
    <div
      className="px-5 py-3.5 hover:bg-[#F4F5F6] transition-colors cursor-pointer group"
      onClick={() => setExpandido(e => !e)}
    >
      <div className="flex items-center gap-3">
        {/* Icono tipo */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorCls}`}>
          {TIPO_ICON[act.tipo]}
        </div>

        {/* Resumen */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[#252A31]">{resumen.titulo}</span>
            {resumen.badge && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-current opacity-70">
                {resumen.badge}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-xs text-[#737B86]">{FECHA_CORTA(act.fecha)} · {HORA(act.fecha)}</span>
            {act.registradoPor && (
              <span className="text-xs text-[#A0A6AE]">por {act.registradoPor.nombre}</span>
            )}
          </div>
        </div>

        {/* Monto / valor */}
        {resumen.valor && (
          <span className="text-sm font-semibold text-[#252A31] flex-shrink-0 font-mono">
            {resumen.valor}
          </span>
        )}

        {/* Flecha */}
        <div className={`flex items-center gap-1 flex-shrink-0 transition-colors ${expandido ? 'text-amber-500' : 'text-[#C6CAD0] group-hover:text-[#8B9299]'}`}>
          <svg
            className={`w-4 h-4 transition-transform ${expandido ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Detalle expandido */}
      {expandido && (
        <div className="mt-3 pl-11">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
            {buildDetalleExpandido(act).map(({ label, value }) => value ? (
              <div key={label}>
                <div className="text-xs text-[#A0A6AE]">{label}</div>
                <div className="text-xs text-[#252A31] font-medium mt-0.5">{value}</div>
              </div>
            ) : null)}
            {act.notas && (
              <div className="col-span-full mt-1">
                <div className="text-xs text-[#A0A6AE]">Notas</div>
                <div className="text-xs text-[#737B86] mt-0.5 italic">{act.notas}</div>
              </div>
            )}
          </div>
          {(onEditComb || onDelete) && (
            <div className="mt-3 flex items-center gap-2">
              {onEditComb && (
                <button
                  onClick={e => { e.stopPropagation(); onEditComb() }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#E1E4E8] bg-white text-[#737B86] hover:text-[#252A31] hover:border-[#C6CAD0] transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Editar carga
                </button>
              )}
              {onDelete && (
                <button
                  disabled={eliminando}
                  onClick={async e => {
                    e.stopPropagation()
                    if (!confirm('¿Eliminar este registro?')) return
                    setEliminando(true)
                    try {
                      await onDelete()
                    } finally {
                      setEliminando(false)
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-red-100 bg-white text-red-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {eliminando ? 'Eliminando…' : 'Eliminar'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ——— Helpers de actividad ————————————————————————————————————
function buildResumen(act) {
  switch (act.tipo) {
    case 'KILOMETRAJE': {
      const km = act.kmRegistro
      return {
        titulo: `Odómetro: ${KM(km?.odometroActual)}`,
        valor:  km?.kmRecorridos ? `+${km.kmRecorridos.toLocaleString('es-CL')} km` : null,
      }
    }
    case 'COMBUSTIBLE': {
      const c = act.combustibleRegistro
      return {
        titulo: `${c?.litros ? `${Number(c.litros).toFixed(1)} L` : '—'} · ${c?.tipoCombustible?.replace('BENCINA_', 'Bencina ') || '—'}`,
        valor:  FMT(c?.monto),
      }
    }
    case 'PEAJE': {
      const p = act.peajeRegistro
      return {
        titulo: p?.autopista ? `Peaje · ${p.autopista}` : 'Peaje',
        badge:  p?.esTag ? 'Tag' : null,
        valor:  p?.esTag && !p.monto ? 'Sin monto' : FMT(p?.monto),
      }
    }
    case 'MANTENCION': {
      const m = act.mantencionRegistro
      return {
        titulo: MANT_LABEL[m?.tipo] || m?.tipo || 'Mantención',
        valor:  m?.costo ? FMT(m.costo) : null,
      }
    }
    case 'CAMBIO_ESTADO': {
      const e = act.estadoCambio
      return {
        titulo: `Estado → ${ESTADOS[e?.estadoNuevo]?.label || e?.estadoNuevo}`,
      }
    }
    case 'TRASLADO': {
      const t = act.trasladoRegistro
      const kmRec = t?.kmSalida && t?.kmLlegada ? t.kmLlegada - t.kmSalida : null
      return {
        titulo: t?.destino ? `Traslado → ${t.destino}` : 'Traslado',
        valor:  kmRec ? `${kmRec.toLocaleString('es-CL')} km` : null,
      }
    }
    default:
      return { titulo: act.tipo }
  }
}

function buildDetalleExpandido(act) {
  switch (act.tipo) {
    case 'KILOMETRAJE': {
      const km = act.kmRegistro
      return [
        { label: 'Odómetro',      value: KM(km?.odometroActual) },
        { label: 'Km recorridos', value: km?.kmRecorridos ? `${km.kmRecorridos.toLocaleString('es-CL')} km` : null },
      ]
    }
    case 'COMBUSTIBLE': {
      const c = act.combustibleRegistro
      return [
        { label: 'Combustible',   value: c?.tipoCombustible?.replace('BENCINA_', 'Bencina ') },
        { label: 'Litros',        value: c?.litros ? `${Number(c.litros).toFixed(2)} L` : null },
        { label: 'Monto',         value: FMT(c?.monto) },
        { label: 'Precio/L',      value: c?.precioLitro ? `$${c.precioLitro.toLocaleString('es-CL')}/L` : null },
        { label: 'Estación',      value: c?.estacion },
        { label: 'Odómetro',      value: c?.odometroAlCargar ? KM(c.odometroAlCargar) : null },
      ]
    }
    case 'PEAJE': {
      const p = act.peajeRegistro
      return [
        { label: 'Monto',         value: p?.esTag && !p?.monto ? 'Pendiente (Tag)' : FMT(p?.monto) },
        { label: 'Autopista',     value: p?.autopista },
        { label: 'Sentido',       value: SENTIDO_LABEL[p?.sentido] },
        { label: 'Pago',          value: p?.esTag ? 'Tag electrónico' : 'Efectivo / tarjeta' },
      ]
    }
    case 'MANTENCION': {
      const m = act.mantencionRegistro
      return [
        { label: 'Tipo',          value: MANT_LABEL[m?.tipo] || m?.tipo },
        { label: 'Taller',        value: m?.taller },
        { label: 'Costo',         value: m?.costo ? FMT(m.costo) : null },
        { label: 'N° folio',      value: m?.numeroFolio },
        { label: 'Odómetro',      value: m?.odometro ? KM(m.odometro) : null },
        { label: 'Próx. fecha',   value: m?.proxFecha ? FECHA(m.proxFecha) : null },
        { label: 'Próx. km',      value: m?.proxKm ? KM(m.proxKm) : null },
        { label: 'Descripción',   value: m?.descripcion },
      ]
    }
    case 'CAMBIO_ESTADO': {
      const e = act.estadoCambio
      return [
        { label: 'Estado anterior', value: ESTADOS[e?.estadoAnterior]?.label },
        { label: 'Estado nuevo',    value: ESTADOS[e?.estadoNuevo]?.label },
        { label: 'Motivo',          value: e?.motivo },
        { label: 'Taller',          value: e?.tallerNombre },
        { label: 'Retorno estimado',value: e?.fechaRetornoEstimada ? FECHA(e.fechaRetornoEstimada) : null },
      ]
    }
    case 'TRASLADO': {
      const t = act.trasladoRegistro
      const kmRec = t?.kmSalida && t?.kmLlegada ? t.kmLlegada - t.kmSalida : null
      return [
        { label: 'Destino',         value: t?.destino },
        { label: 'Motivo / comisión', value: t?.motivo },
        { label: 'Km salida',       value: t?.kmSalida ? KM(t.kmSalida) : null },
        { label: 'Km llegada',      value: t?.kmLlegada ? KM(t.kmLlegada) : null },
        { label: 'Km recorridos',   value: kmRec ? `${kmRec.toLocaleString('es-CL')} km` : null },
      ]
    }
    default:
      return []
  }
}

// ——— Sub-componentes ————————————————————————————————————————
function InfoItem({ label, value, alert }) {
  return (
    <div>
      <div className="text-xs text-[#A0A6AE] mb-0.5">{label}</div>
      <div className={`text-sm font-medium ${alert ? 'text-amber-600' : 'text-[#252A31]'}`}>
        {alert && <span className="mr-1">⚠️</span>}
        {value}
      </div>
    </div>
  )
}

const STAT_COLORS = {
  total:       'bg-amber-50   border-amber-200   text-amber-700',
  combustible: 'bg-orange-50  border-orange-200  text-orange-700',
  peajes:      'bg-purple-50  border-purple-200  text-purple-700',
  km:          'bg-sky-50     border-sky-200     text-sky-700',
  default:     'bg-white      border-[#E1E4E8]   text-[#252A31]',
}

function StatCard({ label, value, sub, icon, color }) {
  const cls = STAT_COLORS[color] || STAT_COLORS.default
  return (
    <div className={`rounded-xl border px-4 py-3.5 flex items-center gap-3 ${cls}`}>
      {icon && <span className="text-xl flex-shrink-0">{icon}</span>}
      <div className="min-w-0">
        <div className="text-xs font-semibold opacity-60 uppercase tracking-wide">{label}</div>
        <div className="text-base font-bold leading-tight mt-0.5">{value}</div>
        {sub && <div className="text-xs opacity-60 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

// ——— Diccionarios ————————————————————————————————————————————
const MANT_LABEL = {
  CAMBIO_ACEITE:       'Cambio de aceite y filtro',
  CAMBIO_FILTROS:      'Cambio de filtros',
  NEUMATICOS:          'Cambio de neumáticos',
  FRENOS:              'Revisión / cambio de frenos',
  BATERIA:             'Cambio de batería',
  CORREA_DISTRIBUCION: 'Correa de distribución',
  MANTENCION_GENERAL:  'Mantención general',
  REVISION_TECNICA:    'Revisión técnica (RT)',
  PERMISO_CIRCULACION: 'Permiso de circulación',
  SOAP:                'SOAP',
  SEGURO_VOLUNTARIO:   'Seguro del vehículo',
  OTRO:                'Otro',
}

const DOC_LABEL = {
  REVISION_TECNICA:    'RT',
  PERMISO_CIRCULACION: 'Permiso',
  SOAP:                'SOAP',
  SEGURO_VOLUNTARIO:   'Seguro',
}

// ——— Modal: Editar vehículo ————————————————————————————————————
function EditarVehiculo({ vehiculo, onClose, onSuccess }) {
  const [form,    setForm]    = useState({
    marca:              vehiculo.marca,
    modelo:             vehiculo.modelo,
    anio:               vehiculo.anio,
    patente:            vehiculo.patente,
    color:              vehiculo.color || '',
    categoria:          vehiculo.categoria || '',
    numeroInterno:      vehiculo.numeroInterno || '',
    region:             vehiculo.region || '',
    unidadOperativa:    vehiculo.unidadOperativa || '',
    conductorId:        vehiculo.conductorId || '',
    proxMantencionKm:   vehiculo.proxMantencionKm || '',
    proxMantencionFecha: vehiculo.proxMantencionFecha
      ? new Date(vehiculo.proxMantencionFecha).toISOString().slice(0, 10)
      : '',
    tieneTag:           vehiculo.tieneTag || false,
    odometroActual:     vehiculo.odometroActual != null ? String(vehiculo.odometroActual) : '',
  })
  const [conductores, setConductores] = useState([])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  useEffect(() => {
    api.get('/flota/conductores?activo=true').then(r => {
      // El endpoint retorna un array directo (no paginado)
      const list = Array.isArray(r.data) ? r.data : (r.data.data || [])
      setConductores(list)
    }).catch(() => {})
  }, [])

  function set(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.marca || !form.modelo || !form.anio || !form.patente) {
      return setError('Marca, modelo, año y patente son obligatorios')
    }
    setLoading(true)
    try {
      const payload = {
        marca:            form.marca,
        modelo:           form.modelo,
        anio:             Number(form.anio),
        patente:          form.patente,
        color:            form.color || null,
        categoria:        form.categoria || null,
        numeroInterno:    form.numeroInterno || null,
        region:           form.region || null,
        unidadOperativa:  form.unidadOperativa || null,
        conductorId:      form.conductorId || null,
        proxMantencionKm: form.proxMantencionKm ? Number(form.proxMantencionKm) : null,
        proxMantencionFecha: form.proxMantencionFecha || null,
        tieneTag:         form.tieneTag,
        odometroActual:   form.odometroActual !== '' ? Number(form.odometroActual) : null,
      }
      const res = await api.put(`/flota/vehiculos/${vehiculo.id}`, payload)
      onSuccess(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-white border border-[#E1E4E8] rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#E1E4E8] px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-base font-bold text-[#252A31]">Editar vehículo</h2>
          <button onClick={onClose} className="text-[#737B86] hover:text-[#252A31] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {/* Fila marca / modelo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Marca *</label>
              <input className="input mt-1" value={form.marca} onChange={e => set('marca', e.target.value)} />
            </div>
            <div>
              <label className="field-label">Modelo *</label>
              <input className="input mt-1" value={form.modelo} onChange={e => set('modelo', e.target.value)} />
            </div>
          </div>
          {/* Año / Patente */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Año *</label>
              <input type="number" className="input mt-1" value={form.anio} onChange={e => set('anio', e.target.value)} min={1990} max={2030} />
            </div>
            <div>
              <label className="field-label">Patente *</label>
              <input className="input mt-1 uppercase" value={form.patente} onChange={e => set('patente', e.target.value.toUpperCase())} />
            </div>
          </div>
          {/* Color / Categoría */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Color</label>
              <input className="input mt-1" value={form.color} onChange={e => set('color', e.target.value)} placeholder="Blanco" />
            </div>
            <div>
              <label className="field-label">Categoría</label>
              <input className="input mt-1" value={form.categoria} onChange={e => set('categoria', e.target.value)} placeholder="Camioneta, Furgón…" />
            </div>
          </div>
          {/* N° interno / Odómetro */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">N° interno</label>
              <input className="input mt-1" value={form.numeroInterno} onChange={e => set('numeroInterno', e.target.value)} placeholder="01" />
            </div>
            <div>
              <label className="field-label">Odómetro actual</label>
              <div className="relative mt-1">
                <input
                  type="number"
                  className="input pr-8"
                  value={form.odometroActual}
                  onChange={e => set('odometroActual', e.target.value)}
                  placeholder="85000"
                  min={0}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#737B86]">km</span>
              </div>
              <p className="text-[10px] text-[#A0A6AE] mt-1">Solo para corrección manual</p>
            </div>
          </div>
          {/* Región / Unidad operativa */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Región</label>
              <input list="regiones-chile-editar" className="input mt-1" value={form.region} onChange={e => set('region', e.target.value)} placeholder="Biobío" />
              <datalist id="regiones-chile-editar">
                {REGIONES_CHILE.map(r => <option key={r} value={r} />)}
              </datalist>
            </div>
            <div>
              <label className="field-label">Unidad operativa</label>
              <input className="input mt-1" value={form.unidadOperativa} onChange={e => set('unidadOperativa', e.target.value)} placeholder="Flota norte" />
            </div>
          </div>
          {/* Conductor */}
          <div>
            <label className="field-label">Conductor asignado</label>
            <select className="input mt-1" value={form.conductorId} onChange={e => set('conductorId', e.target.value)}>
              <option value="">Sin asignar</option>
              {conductores.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          {/* Próximas mantenciones */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Próx. mantención km</label>
              <div className="relative mt-1">
                <input type="number" className="input pr-8" value={form.proxMantencionKm}
                  onChange={e => set('proxMantencionKm', e.target.value)} placeholder="90000" />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#737B86]">km</span>
              </div>
            </div>
            <div>
              <label className="field-label">Próx. mantención fecha</label>
              <input type="date" className="input mt-1" value={form.proxMantencionFecha}
                onChange={e => set('proxMantencionFecha', e.target.value)} />
            </div>
          </div>
          {/* Tag */}
          <button
            type="button"
            onClick={() => set('tieneTag', !form.tieneTag)}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border transition-all text-left
              ${form.tieneTag
                ? 'border-blue-200 bg-blue-50 text-blue-600'
                : 'border-[#E1E4E8] bg-[#F4F5F6] text-[#737B86] hover:border-[#C6CAD0]'}`}
          >
            <svg className={`w-5 h-5 flex-shrink-0 ${form.tieneTag ? 'text-blue-500' : 'text-[#A0A6AE]'}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
              <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
            </svg>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold">Tag electrónico</div>
              <div className={`text-xs mt-0.5 ${form.tieneTag ? 'text-blue-500' : 'text-[#A0A6AE]'}`}>
                {form.tieneTag ? 'Vehículo tiene tag activo' : 'Activar si el vehículo tiene tag de peaje'}
              </div>
            </div>
            <div className={`w-9 h-5 rounded-full flex-shrink-0 relative transition-colors ${form.tieneTag ? 'bg-blue-500' : 'bg-[#D1D5DB]'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.tieneTag ? 'left-4' : 'left-0.5'}`} />
            </div>
          </button>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-ghost">Cancelar</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold transition-colors disabled:opacity-50">
              {loading ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ——— Modal: Editar carga de combustible ————————————————————————
function EditarCombustible({ actividad, vehiculoId, onClose, onSuccess }) {
  const c = actividad.combustibleRegistro
  // Parsear fecha/hora de la actividad para el form
  const fechaAct = actividad.fecha ? new Date(actividad.fecha) : new Date()
  const fechaLocal = `${fechaAct.getFullYear()}-${String(fechaAct.getMonth()+1).padStart(2,'0')}-${String(fechaAct.getDate()).padStart(2,'0')}`
  const horaLocal  = `${String(fechaAct.getHours()).padStart(2,'0')}:${String(fechaAct.getMinutes()).padStart(2,'0')}`

  const [form,    setForm]    = useState({
    tipoCombustible: c?.tipoCombustible || '',
    litros:          c?.litros ? String(Number(c.litros)) : '',
    monto:           c?.monto || '',
    estacion:        c?.estacion || '',
    odometroAlCargar: c?.odometroAlCargar || '',
    fecha:           fechaLocal,
    hora:            horaLocal,
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  function set(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.monto || Number(form.monto) <= 0) return setError('El monto es obligatorio')
    setLoading(true)
    try {
      // Combinar fecha + hora local → ISO string con timezone correcto
      const [anio, mes, dia] = form.fecha.split('-').map(Number)
      const [hh, mm] = form.hora.split(':').map(Number)
      const fechaFinal = new Date(anio, mes - 1, dia, hh, mm, 0).toISOString()

      await api.put(`/flota/vehiculos/${vehiculoId}/actividades/${actividad.id}/combustible`, {
        tipoCombustible:  form.tipoCombustible,
        litros:           form.litros ? Number(form.litros) : null,
        monto:            Number(form.monto),
        estacion:         form.estacion || null,
        odometroAlCargar: form.odometroAlCargar ? Number(form.odometroAlCargar) : null,
        fecha:            fechaFinal,
      })
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-white border border-[#E1E4E8] rounded-2xl shadow-2xl">
        <div className="border-b border-[#E1E4E8] px-5 py-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#252A31]">Editar carga de combustible</h2>
          <button onClick={onClose} className="text-[#737B86] hover:text-[#252A31] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {/* Tipo */}
          <div>
            <label className="field-label">Tipo de combustible</label>
            <div className="flex gap-2 mt-1.5">
              {[['DIESEL','Diesel'],['BENCINA_93','93'],['BENCINA_95','95'],['BENCINA_97','97']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => set('tipoCombustible', v)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all
                    ${form.tipoCombustible === v
                      ? 'border-[#86EFAC] bg-[#DCFCE7] text-[#16A34A]'
                      : 'border-[#E1E4E8] bg-[#F4F5F6] text-[#737B86] hover:border-[#C6CAD0]'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          {/* Litros / Monto */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Litros <span className="text-[#A0A6AE] font-normal">(opcional)</span></label>
              <div className="relative mt-1">
                <input type="number" className="input pr-7" placeholder="42"
                  value={form.litros}
                  onChange={e => set('litros', e.target.value)} />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#737B86]">L</span>
              </div>
            </div>
            <div>
              <label className="field-label">Monto total *</label>
              <div className="relative mt-1">
                <input type="number" className="input pr-5" placeholder="74000"
                  value={form.monto}
                  onChange={e => set('monto', e.target.value)} />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#737B86]">$</span>
              </div>
            </div>
          </div>
          {/* Estación / Odómetro */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Estación</label>
              <input className="input mt-1" placeholder="Copec"
                value={form.estacion}
                onChange={e => set('estacion', e.target.value)} />
            </div>
            <div>
              <label className="field-label">Odómetro al cargar</label>
              <div className="relative mt-1">
                <input type="number" className="input pr-8" placeholder="87420"
                  value={form.odometroAlCargar}
                  onChange={e => set('odometroAlCargar', e.target.value)} />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#737B86]">km</span>
              </div>
            </div>
          </div>

          {/* Fecha / Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Fecha</label>
              <input type="date" className="input mt-1"
                value={form.fecha}
                onChange={e => set('fecha', e.target.value)} />
            </div>
            <div>
              <label className="field-label">Hora</label>
              <input type="time" className="input mt-1"
                value={form.hora}
                onChange={e => set('hora', e.target.value)} />
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-ghost">Cancelar</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold transition-colors disabled:opacity-50">
              {loading ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ——— Modal recarga cupón ——————————————————————————————————————
function RecargaCupon({ vehiculo, onClose, onSuccess }) {
  const [monto,   setMonto]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    if (!monto || Number(monto) <= 0) { setError('Ingresa un monto válido'); return }
    setLoading(true); setError('')
    try {
      const res = await api.post(`/flota/vehiculos/${vehiculo.id}/recargar-cupon`, { monto: Number(monto) })
      onSuccess({ ...vehiculo, saldoCupon: res.data.saldoCupon })
    } catch {
      setError('Error al recargar saldo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-bold text-[#252A31] mb-1">Recargar cupón electrónico</h3>
        <p className="text-xs text-[#737B86] mb-4">
          Saldo actual: <span className="font-semibold text-[#252A31]">{`$${Number(vehiculo.saldoCupon).toLocaleString('es-CL')}`}</span>
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="field-label">Monto a recargar</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#737B86]">$</span>
              <input
                type="number"
                className="input pl-7"
                value={monto}
                onChange={e => setMonto(e.target.value)}
                placeholder="50000"
                min={1}
                autoFocus
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 btn-ghost">Cancelar</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition-colors disabled:opacity-50">
              {loading ? 'Recargando…' : 'Recargar saldo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
