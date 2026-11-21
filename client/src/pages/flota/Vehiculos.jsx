// pages/flota/Vehiculos.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVehiculos, useDashboard } from '../../hooks/useFlota'
import NuevaActividad      from '../../components/flota/NuevaActividad'
import NuevoVehiculo       from '../../components/flota/NuevoVehiculo'
import DocumentosVehiculo  from '../../components/flota/DocumentosVehiculo'

const ESTADOS = {
  OPERATIVO:         { label: 'Operativo',          color: 'text-green-400  bg-green-400/10  border-green-400/30'  },
  EN_TALLER:         { label: 'En taller',           color: 'text-amber-400  bg-amber-400/10  border-amber-400/30'  },
  FUERA_DE_SERVICIO: { label: 'Fuera de servicio',   color: 'text-red-400    bg-red-400/10    border-red-400/30'    },
}

export default function FlotaVehiculos() {
  const navigate = useNavigate()
  const [filters, setFilters]           = useState({ estado: '', search: '' })
  const [modalVehiculo, setModalVehiculo]   = useState(null)
  const [modalNuevo,    setModalNuevo]      = useState(false)
  const [modalDocs,     setModalDocs]       = useState(null)  // { id, patente, marca, modelo }

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
    </div>
  )
}

function VehiculoRow({ vehiculo: v, onVerFicha, onNuevaActividad, onDocumentos }) {
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
      <td className="px-4 py-3 text-zinc-300">
        {v.conductor?.nombre ?? <span className="text-zinc-500 italic">Sin asignar</span>}
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
