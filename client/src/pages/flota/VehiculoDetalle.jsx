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
}

const TIPO_COLOR = {
  KILOMETRAJE:   'text-[#737B86]  bg-[#F4F5F6]',
  COMBUSTIBLE:   'text-[#16A34A] bg-[#DCFCE7]',
  PEAJE:         'text-blue-500  bg-blue-50',
  MANTENCION:    'text-[#D97706] bg-[#FEF3C7]',
  CAMBIO_ESTADO: 'text-purple-600 bg-purple-50',
}

const TIPO_LABEL = {
  KILOMETRAJE:   'Kilometraje',
  COMBUSTIBLE:   'Combustible',
  PEAJE:         'Peaje',
  MANTENCION:    'Mantención',
  CAMBIO_ESTADO: 'Estado',
}

const SENTIDO_LABEL = { IDA: 'Ida', VUELTA: 'Vuelta', IDA_Y_VUELTA: 'Ida y vuelta' }

// ——— Tabs ————————————————————————————————————————————————————
const TABS = [
  { key: 'resumen',      label: 'Resumen'      },
  { key: 'actividad',    label: 'Actividad'    },
  { key: 'mantenciones', label: 'Mantenciones' },
  { key: 'combustible',  label: 'Combustible'  },
  { key: 'documentos',   label: 'Documentos'   },
  { key: 'costos',       label: 'Costos'       },
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
    if (tab === 'mantenciones') setFiltroTipo('MANTENCION')
    else if (tab === 'combustible') setFiltroTipo('COMBUSTIBLE')
    else if (['resumen', 'actividad', 'costos'].includes(tab)) setFiltroTipo('')
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
              <StatCard label="Gasto total"   value={FMT(stats.gastoTotal)}        icon="💰" />
              <StatCard label="Combustible"   value={FMT(stats.gastoCombustible)}  sub={stats.litrosTotales ? `${Number(stats.litrosTotales).toFixed(1)} L` : ''} icon="⛽" />
              <StatCard label="Peajes"        value={FMT(stats.gastoPeajes)}       icon="🏷️" />
              <StatCard label="Km recorridos" value={KM(stats.kmRecorridos)}       icon="📍" />
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
              {total > 10 && (
                <button
                  onClick={() => setTab('actividad')}
                  className="text-xs text-amber-600 hover:text-amber-700 font-semibold transition-colors"
                >
                  Ver todo ({total}) →
                </button>
              )}
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
            {actividades.length > 0 && (
              <div className="bg-white border border-[#E1E4E8] rounded-xl overflow-hidden">
                <div className="divide-y divide-[#E5E7EB]">
                  {actividades.slice(0, 10).map(act => (
                    <ActividadRow
                      key={act.id}
                      actividad={act}
                      esAdmin={esAdmin}
                      onEditComb={esAdmin && act.tipo === 'COMBUSTIBLE' ? () => setModalEditComb(act) : null}
                    />
                  ))}
                </div>
                {total > 10 && (
                  <div className="px-5 py-3 border-t border-[#E5E7EB] text-center">
                    <button onClick={() => setTab('actividad')} className="text-xs text-[#737B86] hover:text-[#252A31] font-semibold transition-colors">
                      Ver todo el historial ({total} registros) →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ Tab: Actividad ══ */}
      {tab === 'actividad' && (
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <span className="text-xs font-semibold text-[#737B86] uppercase tracking-wider">
              Historial de actividades
              {total > 0 && <span className="ml-2 text-[#A0A6AE] normal-case font-normal">{total} registros</span>}
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {['', 'KILOMETRAJE', 'COMBUSTIBLE', 'PEAJE', 'MANTENCION', 'CAMBIO_ESTADO'].map(t => (
                <button
                  key={t}
                  onClick={() => setFiltroTipo(t)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all
                    ${filtroTipo === t
                      ? 'border-[#252A31] bg-[#252A31] text-white'
                      : 'border-[#E1E4E8] text-[#737B86] hover:text-[#252A31]'}`}
                >
                  {t ? TIPO_LABEL[t] : 'Todos'}
                </button>
              ))}
            </div>
          </div>
          {loadingActs && actividades.length === 0 && (
            <div className="flex items-center justify-center py-12 text-[#737B86] text-sm">Cargando…</div>
          )}
          {!loadingActs && actividades.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white border border-[#E1E4E8] rounded-xl">
              <p className="text-[#737B86] text-sm">Sin actividades registradas</p>
              <button onClick={() => setModalActividad(true)} className="mt-3 text-xs text-amber-600 hover:text-amber-700 font-semibold">
                + Registrar primera actividad
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
                    onEditComb={esAdmin && act.tipo === 'COMBUSTIBLE' ? () => setModalEditComb(act) : null}
                  />
                ))}
              </div>
              {actividades.length < total && (
                <div className="px-5 py-3 border-t border-[#E5E7EB] text-center">
                  <button
                    onClick={() => cargarActividades(page + 1, filtroTipo)}
                    disabled={loadingActs}
                    className="text-xs text-[#737B86] hover:text-[#252A31] font-semibold disabled:opacity-50 transition-colors"
                  >
                    {loadingActs ? 'Cargando…' : `Cargar más (${total - actividades.length} restantes)`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ Tab: Mantenciones ══ */}
      {tab === 'mantenciones' && (
        <div className="flex flex-col gap-5">
          {/* Próxima mantención */}
          <div className={`flex items-start gap-4 p-4 rounded-xl border ${mantBadgeStyle}`}>
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
            </svg>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Próxima mantención</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${mantBadgeStyle}`}>
                  {estadoMant === 'OK' ? 'Al día' : estadoMant === 'PROXIMA' ? 'Próxima' : 'Vencida'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs mt-2">
                {vehiculo.proxMantencionFecha && (
                  <div>
                    <span className="text-current opacity-60">Fecha</span>
                    <div className="font-semibold">{FECHA(vehiculo.proxMantencionFecha)}</div>
                  </div>
                )}
                {vehiculo.proxMantencionKm && (
                  <div>
                    <span className="text-current opacity-60">Km programado</span>
                    <div className="font-semibold">{KM(vehiculo.proxMantencionKm)}</div>
                  </div>
                )}
                {vehiculo.proxMantencionKm && vehiculo.odometroActual != null && (
                  <div>
                    <span className="text-current opacity-60">Km restantes</span>
                    <div className="font-semibold">
                      {vehiculo.proxMantencionKm - vehiculo.odometroActual > 0
                        ? `${(vehiculo.proxMantencionKm - vehiculo.odometroActual).toLocaleString('es-CL')} km`
                        : `Excedido ${(vehiculo.odometroActual - vehiculo.proxMantencionKm).toLocaleString('es-CL')} km`}
                    </div>
                  </div>
                )}
                {!vehiculo.proxMantencionFecha && !vehiculo.proxMantencionKm && (
                  <div className="col-span-2 opacity-60">Sin mantención programada</div>
                )}
              </div>
            </div>
            {esAdmin && (
              <button
                onClick={() => setModalEditar(true)}
                className="text-xs opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
              >
                Editar →
              </button>
            )}
          </div>

          {/* Historial de mantenciones */}
          <div>
            <div className="text-xs font-semibold text-[#737B86] uppercase tracking-wider mb-3">
              Historial de mantenciones
              {total > 0 && <span className="ml-2 text-[#A0A6AE] normal-case font-normal">{total} registros</span>}
            </div>
            {loadingActs && actividades.length === 0 && (
              <div className="flex items-center justify-center py-12 text-[#737B86] text-sm">Cargando…</div>
            )}
            {!loadingActs && actividades.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center bg-white border border-[#E1E4E8] rounded-xl">
                <p className="text-[#737B86] text-sm">Sin mantenciones registradas</p>
                <button onClick={() => setModalActividad(true)} className="mt-3 text-xs text-amber-600 hover:text-amber-700 font-semibold">
                  + Registrar mantención
                </button>
              </div>
            )}
            {actividades.length > 0 && (
              <div className="bg-white border border-[#E1E4E8] rounded-xl overflow-hidden">
                <div className="divide-y divide-[#E5E7EB]">
                  {actividades.map(act => (
                    <ActividadRow key={act.id} actividad={act} esAdmin={esAdmin} />
                  ))}
                </div>
                {actividades.length < total && (
                  <div className="px-5 py-3 border-t border-[#E5E7EB] text-center">
                    <button onClick={() => cargarActividades(page + 1, 'MANTENCION')} disabled={loadingActs}
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

      {/* ══ Tab: Combustible ══ */}
      {tab === 'combustible' && (
        <div className="flex flex-col gap-5">
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
    </div>
  )
}

// ——— Fila de actividad ———————————————————————————————————————
function ActividadRow({ actividad: act, onEditComb }) {
  const [expandido, setExpandido] = useState(false)

  const colorCls = TIPO_COLOR[act.tipo] || 'text-[#737B86] bg-[#F4F5F6]'
  const resumen  = buildResumen(act)

  return (
    <div
      className="px-5 py-3.5 hover:bg-[#F4F5F6] transition-colors cursor-pointer"
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
        <svg
          className={`w-4 h-4 text-[#A0A6AE] flex-shrink-0 transition-transform ${expandido ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
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
          {onEditComb && (
            <button
              onClick={e => { e.stopPropagation(); onEditComb() }}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#E1E4E8] bg-white text-[#737B86] hover:text-[#252A31] hover:border-[#C6CAD0] transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Editar carga
            </button>
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

function StatCard({ label, value, sub, icon }) {
  return (
    <div className="bg-white border border-[#E1E4E8] rounded-xl px-4 py-3.5 flex items-center gap-3">
      <span className="text-xl">{icon}</span>
      <div className="min-w-0">
        <div className="text-xs text-[#737B86]">{label}</div>
        <div className="text-base font-bold text-[#252A31] leading-tight mt-0.5">{value}</div>
        {sub && <div className="text-xs text-[#737B86] mt-0.5">{sub}</div>}
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
          {/* N° interno */}
          <div>
            <label className="field-label">N° interno</label>
            <input className="input mt-1" value={form.numeroInterno} onChange={e => set('numeroInterno', e.target.value)} placeholder="01" />
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
  const [form,    setForm]    = useState({
    tipoCombustible: c?.tipoCombustible || '',
    litros:          c?.litros ? String(Number(c.litros)) : '',
    monto:           c?.monto || '',
    estacion:        c?.estacion || '',
    odometroAlCargar: c?.odometroAlCargar || '',
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
      await api.put(`/flota/vehiculos/${vehiculoId}/actividades/${actividad.id}/combustible`, {
        tipoCombustible:  form.tipoCombustible,
        litros:           form.litros ? Number(form.litros) : null,
        monto:            Number(form.monto),
        estacion:         form.estacion || null,
        odometroAlCargar: form.odometroAlCargar ? Number(form.odometroAlCargar) : null,
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
