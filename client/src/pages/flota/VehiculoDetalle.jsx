// pages/flota/VehiculoDetalle.jsx
// Ficha completa de un vehículo: stats del mes, historial de actividades, documentos.

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import NuevaActividad     from '../../components/flota/NuevaActividad'
import DocumentosVehiculo from '../../components/flota/DocumentosVehiculo'

// ——— Helpers ——————————————————————————————————————————————————
const FMT  = n => n != null ? `$${Number(n).toLocaleString('es-CL')}` : '—'
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
  OPERATIVO:         { label: 'Operativo',          color: 'text-green-400 bg-green-400/10 border-green-400/30' },
  EN_TALLER:         { label: 'En taller',           color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  FUERA_DE_SERVICIO: { label: 'Fuera de servicio',   color: 'text-red-400   bg-red-400/10   border-red-400/30'   },
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
  KILOMETRAJE:   'text-zinc-400  bg-zinc-800',
  COMBUSTIBLE:   'text-green-400 bg-green-400/10',
  PEAJE:         'text-blue-400  bg-blue-400/10',
  MANTENCION:    'text-amber-400 bg-amber-400/10',
  CAMBIO_ESTADO: 'text-purple-400 bg-purple-400/10',
}

const TIPO_LABEL = {
  KILOMETRAJE:   'Kilometraje',
  COMBUSTIBLE:   'Combustible',
  PEAJE:         'Peaje',
  MANTENCION:    'Mantención',
  CAMBIO_ESTADO: 'Estado',
}

const SENTIDO_LABEL = { IDA: 'Ida', VUELTA: 'Vuelta', IDA_Y_VUELTA: 'Ida y vuelta' }

// ——— Componente principal ——————————————————————————————————————
export default function VehiculoDetalle() {
  const { id }     = useParams()
  const navigate   = useNavigate()

  const [vehiculo,  setVehiculo]  = useState(null)
  const [stats,     setStats]     = useState(null)
  const [actividades, setActividades] = useState([])
  const [total,     setTotal]     = useState(0)
  const [page,      setPage]      = useState(1)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [loading,   setLoading]   = useState(true)
  const [loadingActs, setLoadingActs] = useState(false)
  const [error,     setError]     = useState('')

  const [modalActividad, setModalActividad] = useState(false)
  const [modalDocs,      setModalDocs]      = useState(false)

  const hoyMes = new Date().toISOString().slice(0, 7)  // "2026-11"

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500 text-sm">
        Cargando…
      </div>
    )
  }

  if (error || !vehiculo) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <p className="text-red-400 text-sm">{error || 'Vehículo no encontrado'}</p>
        <button onClick={() => navigate('/flota/vehiculos')} className="btn-ghost text-xs">
          ← Volver a vehículos
        </button>
      </div>
    )
  }

  const estado = ESTADOS[vehiculo.estado] ?? ESTADOS.OPERATIVO

  return (
    <div className="flex flex-col gap-5 pb-10">

      {/* ── Breadcrumb ── */}
      <button
        onClick={() => navigate('/flota/vehiculos')}
        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors w-fit"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Vehículos
      </button>

      {/* ── Header del vehículo ── */}
      <div className="bg-[#222] border border-[#363636] rounded-2xl p-5">
        <div className="flex items-start gap-4 flex-wrap">

          {/* Icono */}
          <div className="w-14 h-14 rounded-xl bg-[#2b2b2b] border border-[#404040] flex items-center justify-center flex-shrink-0">
            <svg className="w-7 h-7 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h1l3-4h8l3 4h1a2 2 0 012 2v6a2 2 0 01-2 2h-2" />
              <circle cx="7.5" cy="17.5" r="2.5" /><circle cx="16.5" cy="17.5" r="2.5" />
            </svg>
          </div>

          {/* Info principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-white">
                {vehiculo.marca} {vehiculo.modelo}
              </h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${estado.color}`}>
                {estado.label}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1 flex-wrap">
              <span className="font-mono text-sm text-zinc-300 tracking-widest">{vehiculo.patente}</span>
              <span className="text-zinc-500 text-sm">{vehiculo.anio}</span>
              {vehiculo.categoria && <span className="text-zinc-500 text-sm">{vehiculo.categoria}</span>}
              {vehiculo.color && <span className="text-zinc-500 text-sm">{vehiculo.color}</span>}
              {vehiculo.numeroInterno && <span className="text-xs bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded font-mono">#{vehiculo.numeroInterno}</span>}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setModalDocs(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Documentos
            </button>
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
        <div className="mt-4 pt-4 border-t border-[#2d2d2d] grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoItem
            label="Conductor"
            value={vehiculo.conductor?.nombre || <span className="text-zinc-600 italic">Sin asignar</span>}
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
                      ? 'text-red-400 bg-red-400/10 border-red-400/30'
                      : 'text-amber-400 bg-amber-400/10 border-amber-400/30'}`}
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

      {/* ── Stats del mes ── */}
      {stats && (
        <div>
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Resumen del mes
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Gasto total" value={FMT(stats.gastoTotal)} icon="💰" />
            <StatCard label="Combustible" value={FMT(stats.gastoCombustible)} sub={stats.litrosTotales ? `${Number(stats.litrosTotales).toFixed(1)} L` : ''} icon="⛽" />
            <StatCard label="Peajes" value={FMT(stats.gastoPeajes)} icon="🏷️" />
            <StatCard label="Km recorridos" value={KM(stats.kmRecorridos)} icon="📍" />
          </div>
        </div>
      )}

      {/* ── Historial de actividades ── */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Historial de actividades
            {total > 0 && <span className="ml-2 text-zinc-600 normal-case font-normal">{total} registros</span>}
          </span>
          <div className="flex gap-1.5 flex-wrap">
            {['', 'KILOMETRAJE', 'COMBUSTIBLE', 'PEAJE', 'MANTENCION', 'CAMBIO_ESTADO'].map(t => (
              <button
                key={t}
                onClick={() => setFiltroTipo(t)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all
                  ${filtroTipo === t
                    ? 'border-zinc-500 bg-zinc-700 text-white'
                    : 'border-[#363636] text-zinc-500 hover:text-zinc-300'}`}
              >
                {t ? TIPO_LABEL[t] : 'Todos'}
              </button>
            ))}
          </div>
        </div>

        {loadingActs && actividades.length === 0 && (
          <div className="flex items-center justify-center py-12 text-zinc-600 text-sm">Cargando…</div>
        )}

        {!loadingActs && actividades.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-[#222] border border-[#363636] rounded-xl">
            <p className="text-zinc-500 text-sm">Sin actividades registradas</p>
            <button
              onClick={() => setModalActividad(true)}
              className="mt-3 text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              + Registrar primera actividad
            </button>
          </div>
        )}

        {actividades.length > 0 && (
          <div className="bg-[#222] border border-[#363636] rounded-xl overflow-hidden">
            <div className="divide-y divide-[#2a2a2a]">
              {actividades.map(act => (
                <ActividadRow key={act.id} actividad={act} />
              ))}
            </div>

            {/* Paginación "Cargar más" */}
            {actividades.length < total && (
              <div className="px-5 py-3 border-t border-[#2a2a2a] text-center">
                <button
                  onClick={() => cargarActividades(page + 1, filtroTipo)}
                  disabled={loadingActs}
                  className="text-xs text-zinc-400 hover:text-white font-semibold disabled:opacity-50 transition-colors"
                >
                  {loadingActs ? 'Cargando…' : `Cargar más (${total - actividades.length} restantes)`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

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
          onClose={() => setModalDocs(false)}
        />
      )}
    </div>
  )
}

// ——— Fila de actividad ———————————————————————————————————————
function ActividadRow({ actividad: act }) {
  const [expandido, setExpandido] = useState(false)

  const colorCls = TIPO_COLOR[act.tipo] || 'text-zinc-400 bg-zinc-800'
  const resumen  = buildResumen(act)

  return (
    <div
      className="px-5 py-3.5 hover:bg-[#252525] transition-colors cursor-pointer"
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
            <span className="text-sm font-semibold text-zinc-200">{resumen.titulo}</span>
            {resumen.badge && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-current opacity-70">
                {resumen.badge}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-xs text-zinc-500">{FECHA_CORTA(act.fecha)} · {HORA(act.fecha)}</span>
            {act.registradoPor && (
              <span className="text-xs text-zinc-600">por {act.registradoPor.nombre}</span>
            )}
          </div>
        </div>

        {/* Monto / valor */}
        {resumen.valor && (
          <span className="text-sm font-semibold text-zinc-200 flex-shrink-0 font-mono">
            {resumen.valor}
          </span>
        )}

        {/* Flecha */}
        <svg
          className={`w-4 h-4 text-zinc-600 flex-shrink-0 transition-transform ${expandido ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Detalle expandido */}
      {expandido && (
        <div className="mt-3 pl-11 grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
          {buildDetalleExpandido(act).map(({ label, value }) => value ? (
            <div key={label}>
              <div className="text-xs text-zinc-600">{label}</div>
              <div className="text-xs text-zinc-300 font-medium mt-0.5">{value}</div>
            </div>
          ) : null)}
          {act.notas && (
            <div className="col-span-full mt-1">
              <div className="text-xs text-zinc-600">Notas</div>
              <div className="text-xs text-zinc-400 mt-0.5 italic">{act.notas}</div>
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
      <div className="text-xs text-zinc-600 mb-0.5">{label}</div>
      <div className={`text-sm font-medium ${alert ? 'text-amber-400' : 'text-zinc-200'}`}>
        {alert && <span className="mr-1">⚠️</span>}
        {value}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, icon }) {
  return (
    <div className="bg-[#222] border border-[#363636] rounded-xl px-4 py-3.5 flex items-center gap-3">
      <span className="text-xl">{icon}</span>
      <div className="min-w-0">
        <div className="text-xs text-zinc-500">{label}</div>
        <div className="text-base font-bold text-white leading-tight mt-0.5">{value}</div>
        {sub && <div className="text-xs text-zinc-500 mt-0.5">{sub}</div>}
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
