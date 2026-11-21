// pages/flota/Vehiculos.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVehiculos, useDashboard } from '../../hooks/useFlota'
import NuevaActividad      from '../../components/flota/NuevaActividad'
import NuevoVehiculo       from '../../components/flota/NuevoVehiculo'
import DocumentosVehiculo  from '../../components/flota/DocumentosVehiculo'
import api from '../../lib/api'

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
      <div className="bg-[#22252e] border border-[#2d3039] rounded-2xl w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d3039]">
          <div>
            <div className="text-sm font-semibold text-white">Asignar conductor</div>
            <div className="text-xs text-zinc-400 font-mono">{vehiculo.patente} · {vehiculo.marca} {vehiculo.modelo}</div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {err && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-sm text-red-400">
              {err}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">Conductor asignado</label>
            <select
              value={selected}
              onChange={e => setSelected(e.target.value)}
              className="w-full bg-[#1C1F26] border border-[#2d3039] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              <option value="">— Sin conductor —</option>
              {conductores.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}{c.rut ? ` · ${c.rut}` : ''}</option>
              ))}
            </select>
          </div>

          {selected && vehiculo.conductorId && selected !== vehiculo.conductorId && (
            <p className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
              Se reemplazará el conductor actual.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
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
  OPERATIVO:         { label: 'Operativo',          color: 'text-green-400  bg-green-400/10  border-green-400/30'  },
  EN_TALLER:         { label: 'En taller',           color: 'text-amber-400  bg-amber-400/10  border-amber-400/30'  },
  FUERA_DE_SERVICIO: { label: 'Fuera de servicio',   color: 'text-red-400    bg-red-400/10    border-red-400/30'    },
}

export default function FlotaVehiculos() {
  const navigate = useNavigate()
  const [filters, setFilters]           = useState({ estado: '', search: '' })
  const [modalVehiculo,   setModalVehiculo]   = useState(null)
  const [modalNuevo,      setModalNuevo]      = useState(false)
  const [modalDocs,       setModalDocs]       = useState(null)
  const [modalAsignar,    setModalAsignar]    = useState(null) // vehiculo completo

  const { data: dash }                    = useDashboard()
  const { data, loading, error, refetch } = useVehiculos(filters)
  const vehiculos = data?.data ?? []

  function handleFilter(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  if (error) return (
    <div className="p-8 text-red-400 text-sm">Error al cargar vehículos: {error}</div>
  )

  return (
    <div className="p-7">

      {/* KPI chips */}
      {dash && (
        <div className="flex gap-3 mb-6 flex-wrap">
          <Chip label="Total"              value={dash.vehiculos.total}           />
          <Chip label="Operativos"         value={dash.vehiculos.operativos}      color="text-green-400" />
          <Chip label="En taller"          value={dash.vehiculos.enTaller}        color="text-amber-400" />
          <Chip label="Fuera de servicio"  value={dash.vehiculos.fueraDeServicio} color="text-red-400"   />
          <Chip label="Sin conductor"      value={dash.vehiculos.sinConductor}    color="text-zinc-400"  />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex gap-3 mb-5 flex-wrap items-center">
        <input
          type="text"
          placeholder="Buscar patente, marca…"
          value={filters.search}
          onChange={e => handleFilter('search', e.target.value)}
          className="bg-[#222] border border-[#363636] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-amber-500 w-56"
        />
        <select
          value={filters.estado}
          onChange={e => handleFilter('estado', e.target.value)}
          className="bg-[#222] border border-[#363636] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
        >
          <option value="">Todos los estados</option>
          <option value="OPERATIVO">Operativo</option>
          <option value="EN_TALLER">En taller</option>
          <option value="FUERA_DE_SERVICIO">Fuera de servicio</option>
        </select>

        <div className="ml-auto">
          <button
            onClick={() => setModalNuevo(true)}
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            + Agregar vehículo
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-[#222] border border-[#363636] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#363636] text-xs text-zinc-500 font-semibold uppercase tracking-wide">
              <th className="text-left px-5 py-3">Vehículo</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-left px-4 py-3">Conductor</th>
              <th className="text-right px-4 py-3">Odómetro</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="text-center py-12 text-zinc-500">Cargando…</td></tr>
            )}
            {!loading && vehiculos.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12 text-zinc-500">No se encontraron vehículos</td></tr>
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
        <p className="text-xs text-zinc-500 mt-3">{data.total} vehículos</p>
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
    </div>
  )
}

function VehiculoRow({ vehiculo: v, onVerFicha, onNuevaActividad, onDocumentos, onAsignar }) {
  const estado = ESTADOS[v.estado] ?? ESTADOS.OPERATIVO
  return (
    <tr
      className="border-b border-[#363636] last:border-0 hover:bg-[#2b2b2b] transition-colors cursor-pointer"
      onClick={onVerFicha}
    >
      <td className="px-5 py-3">
        <div className="font-semibold text-white">{v.marca} {v.modelo}</div>
        <div className="text-xs text-zinc-400 mt-0.5 font-mono tracking-wider">{v.patente} · {v.anio}</div>
        {v.categoria && <div className="text-xs text-zinc-500">{v.categoria}</div>}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${estado.color}`}>
          {estado.label}
        </span>
      </td>
      <td className="px-4 py-3" onClick={e => { e.stopPropagation(); onAsignar() }}>
        <button className={`inline-flex items-center gap-1.5 text-sm transition-colors group
          ${v.conductor ? 'text-zinc-200 hover:text-amber-400' : 'text-zinc-500 italic hover:text-amber-400'}`}>
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
      <td className="px-4 py-3 text-right font-mono text-zinc-300">
        {v.odometroActual.toLocaleString('es-CL')} km
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
          <button
            onClick={onNuevaActividad}
            className="px-3 py-1.5 text-xs font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-lg hover:bg-amber-400/20 transition-colors"
          >
            + Actividad
          </button>
          <button
            onClick={onDocumentos}
            className="px-3 py-1.5 text-xs font-semibold text-blue-400 bg-blue-400/10 border border-blue-400/30 rounded-lg hover:bg-blue-400/20 transition-colors"
          >
            Docs
          </button>
          <button
            onClick={onVerFicha}
            className="px-3 py-1.5 text-xs font-semibold text-zinc-300 bg-zinc-700/50 border border-zinc-600 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Ver ficha
          </button>
        </div>
      </td>
    </tr>
  )
}

function Chip({ label, value, color = 'text-zinc-200' }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[#222] border border-[#363636] rounded-xl">
      <span className="text-xs text-zinc-400">{label}</span>
      <span className={`text-lg font-bold leading-none ${color}`}>{value ?? '—'}</span>
    </div>
  )
}
