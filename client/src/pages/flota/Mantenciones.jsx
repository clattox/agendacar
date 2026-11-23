import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'

// ─── helpers ────────────────────────────────────────────────────────────────
const TIPOS_MANTENCION = [
  { value: 'ACEITE',              label: 'Cambio de aceite' },
  { value: 'FILTRO_AIRE',         label: 'Filtro de aire' },
  { value: 'FILTRO_COMBUSTIBLE',  label: 'Filtro de combustible' },
  { value: 'FRENOS',              label: 'Frenos' },
  { value: 'CORREA_DISTRIBUCION', label: 'Correa de distribución' },
  { value: 'NEUMATICOS',          label: 'Neumáticos' },
  { value: 'BATERIA',             label: 'Batería' },
  { value: 'REVISION_TECNICA',    label: 'Revisión técnica' },
  { value: 'PERMISO_CIRCULACION', label: 'Permiso de circulación' },
  { value: 'SOAP',                label: 'SOAP' },
  { value: 'SEGURO_VOLUNTARIO',   label: 'Seguro voluntario' },
  { value: 'GENERAL',             label: 'Mantención general' },
]

function tipoLabel(val) {
  return TIPOS_MANTENCION.find(t => t.value === val)?.label ?? val
}

// ─── Modal Plantilla ─────────────────────────────────────────────────────────
function ModalPlantilla({ plantilla, onClose, onSaved }) {
  const esEdicion = !!plantilla?.id
  const [form, setForm] = useState({
    nombre:       plantilla?.nombre       ?? '',
    tipoRef:      plantilla?.tipoRef      ?? '',
    intervalKm:   plantilla?.intervalKm   ?? '',
    intervalDias: plantilla?.intervalDias ?? '',
  })
  const [guardando, setGuardando] = useState(false)
  const [error,     setError]     = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) return setError('El nombre es obligatorio')
    if (!form.intervalKm && !form.intervalDias)
      return setError('Debe indicar al menos un intervalo (km o días)')
    setGuardando(true)
    setError('')
    try {
      if (esEdicion) {
        await api.put(`/flota/mantenciones/plantillas/${plantilla.id}`, form)
      } else {
        await api.post('/flota/mantenciones/plantillas', form)
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {esEdicion ? 'Editar plantilla' : 'Nueva plantilla'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Cambio de aceite 10.000 km"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de mantención (referencia)
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={form.tipoRef}
              onChange={e => setForm(f => ({ ...f, tipoRef: e.target.value }))}
            >
              <option value="">— Sin tipo asociado —</option>
              {TIPOS_MANTENCION.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Permite actualizar automáticamente el plan al registrar una mantención de este tipo.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intervalo (km)
              </label>
              <input
                type="number" min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={form.intervalKm}
                onChange={e => setForm(f => ({ ...f, intervalKm: e.target.value }))}
                placeholder="10000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intervalo (días)
              </label>
              <input
                type="number" min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={form.intervalDias}
                onChange={e => setForm(f => ({ ...f, intervalDias: e.target.value }))}
                placeholder="365"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >Cancelar</button>
            <button
              type="submit" disabled={guardando}
              className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-medium rounded-lg disabled:opacity-60 whitespace-nowrap"
            >
              {guardando ? 'Guardando…' : (esEdicion ? 'Guardar cambios' : 'Crear plantilla')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Tab Plantillas ───────────────────────────────────────────────────────────
function TabPlantillas() {
  const [plantillas,  setPlantillas]  = useState([])
  const [cargando,    setCargando]    = useState(true)
  const [modal,       setModal]       = useState(null) // null | 'nueva' | {plantilla}
  const [eliminando,  setEliminando]  = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const { data } = await api.get('/flota/mantenciones/plantillas')
      setPlantillas(data)
    } catch {}
    finally { setCargando(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const eliminar = async (p) => {
    if (!confirm(`¿Eliminar la plantilla "${p.nombre}"?`)) return
    setEliminando(p.id)
    try {
      await api.delete(`/flota/mantenciones/plantillas/${p.id}`)
      cargar()
    } catch {}
    finally { setEliminando(null) }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Plantillas de mantención</h2>
          <p className="text-sm text-gray-500">Define las mantenciones programadas y sus intervalos</p>
        </div>
        <button
          onClick={() => setModal('nueva')}
          className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-medium rounded-lg whitespace-nowrap"
        >
          + Nueva plantilla
        </button>
      </div>

      {cargando ? (
        <p className="text-sm text-gray-500">Cargando…</p>
      ) : plantillas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔧</p>
          <p className="font-medium">Sin plantillas aún</p>
          <p className="text-sm mt-1">Crea plantillas para mantenciones como "Cambio de aceite cada 10.000 km"</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-200">
                <th className="pb-2 pr-4 font-medium">Nombre</th>
                <th className="pb-2 pr-4 font-medium">Tipo</th>
                <th className="pb-2 pr-4 font-medium">Cada km</th>
                <th className="pb-2 pr-4 font-medium">Cada días</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plantillas.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="py-3 pr-4 font-medium text-gray-800">{p.nombre}</td>
                  <td className="py-3 pr-4 text-gray-600">
                    {p.tipoRef ? tipoLabel(p.tipoRef) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    {p.intervalKm ? `${p.intervalKm.toLocaleString('es-CL')} km` : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="py-3 pr-4">
                    {p.intervalDias ? `${p.intervalDias} días` : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => setModal(p)}
                      className="text-xs text-amber-600 hover:text-amber-800 font-medium mr-3"
                    >Editar</button>
                    <button
                      onClick={() => eliminar(p)}
                      disabled={eliminando === p.id}
                      className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                    >Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <ModalPlantilla
          plantilla={modal === 'nueva' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); cargar() }}
        />
      )}
    </div>
  )
}

// ─── Modal Asignar Plan ───────────────────────────────────────────────────────
function ModalAsignarPlan({ vehiculos, plantillas, onClose, onSaved }) {
  const [form, setForm] = useState({
    vehiculoId:  '',
    plantillaId: '',
    kmBase:      '',
    fechaBase:   new Date().toISOString().split('T')[0],
    notas:       '',
  })
  const [guardando, setGuardando] = useState(false)
  const [error,     setError]     = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.vehiculoId || !form.plantillaId)
      return setError('Debe seleccionar vehículo y plantilla')
    setGuardando(true)
    setError('')
    try {
      await api.post('/flota/mantenciones/planes', form)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al asignar plan')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Asignar plan a vehículo</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehículo <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={form.vehiculoId}
              onChange={e => setForm(f => ({ ...f, vehiculoId: e.target.value }))}
            >
              <option value="">— Seleccionar —</option>
              {vehiculos.map(v => (
                <option key={v.id} value={v.id}>
                  {v.patente} — {v.marca} {v.modelo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plantilla <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={form.plantillaId}
              onChange={e => setForm(f => ({ ...f, plantillaId: e.target.value }))}
            >
              <option value="">— Seleccionar —</option>
              {plantillas.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Km base (odómetro actual)
              </label>
              <input
                type="number" min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={form.kmBase}
                onChange={e => setForm(f => ({ ...f, kmBase: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha base
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={form.fechaBase}
                onChange={e => setForm(f => ({ ...f, fechaBase: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={form.notas}
              onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
              placeholder="Opcional"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >Cancelar</button>
            <button type="submit" disabled={guardando}
              className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-medium rounded-lg disabled:opacity-60 whitespace-nowrap"
            >
              {guardando ? 'Asignando…' : 'Asignar plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Chip de estado ───────────────────────────────────────────────────────────
function ChipEstado({ estado }) {
  if (estado === 'VENCIDA')
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Vencida</span>
  if (estado === 'PROXIMA')
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Próxima</span>
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Al día</span>
}

// ─── Tab Plan de Flota ────────────────────────────────────────────────────────
function TabPlanFlota({ plantillas }) {
  const [vehiculos,  setVehiculos]  = useState([])
  const [selVeh,     setSelVeh]     = useState('')
  const [planes,     setPlanes]     = useState([])
  const [cargando,   setCargando]   = useState(false)
  const [modal,      setModal]      = useState(false)
  const [eliminando, setEliminando] = useState(null)

  // Cargar lista de vehículos al montar
  useEffect(() => {
    api.get('/flota/vehiculos').then(r => {
      setVehiculos(r.data || [])
      if (r.data?.length) setSelVeh(r.data[0].id)
    }).catch(() => {})
  }, [])

  // Cargar planes del vehículo seleccionado
  useEffect(() => {
    if (!selVeh) return
    setCargando(true)
    api.get(`/flota/mantenciones/planes/${selVeh}`)
      .then(r => setPlanes(r.data || []))
      .catch(() => setPlanes([]))
      .finally(() => setCargando(false))
  }, [selVeh])

  const eliminar = async (plan) => {
    if (!confirm(`¿Eliminar el plan "${plan.plantilla.nombre}" de este vehículo?`)) return
    setEliminando(plan.id)
    try {
      await api.delete(`/flota/mantenciones/planes/${plan.id}`)
      setPlanes(ps => ps.filter(p => p.id !== plan.id))
    } catch {}
    finally { setEliminando(null) }
  }

  const vehActual = vehiculos.find(v => v.id === selVeh)

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Plan de mantención por vehículo</h2>
          <p className="text-sm text-gray-500">Planes programados asignados a cada vehículo de la flota</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-medium rounded-lg whitespace-nowrap"
        >
          + Asignar plan
        </button>
      </div>

      {/* Selector de vehículo */}
      {vehiculos.length > 0 && (
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Vehículo</label>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            value={selVeh}
            onChange={e => setSelVeh(e.target.value)}
          >
            {vehiculos.map(v => (
              <option key={v.id} value={v.id}>
                {v.patente} — {v.marca} {v.modelo}
              </option>
            ))}
          </select>
          {vehActual?.odometroActual > 0 && (
            <span className="ml-3 text-sm text-gray-500">
              Odómetro actual: <strong>{vehActual.odometroActual.toLocaleString('es-CL')} km</strong>
            </span>
          )}
        </div>
      )}

      {cargando ? (
        <p className="text-sm text-gray-500">Cargando…</p>
      ) : planes.length === 0 ? (
        <div className="text-center py-14 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium">Sin planes asignados</p>
          <p className="text-sm mt-1">Asigna plantillas a este vehículo para hacer seguimiento</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-200">
                <th className="pb-2 pr-4 font-medium">Plan</th>
                <th className="pb-2 pr-4 font-medium">Estado</th>
                <th className="pb-2 pr-4 font-medium">Próx. km</th>
                <th className="pb-2 pr-4 font-medium">Próx. fecha</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {planes.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="py-3 pr-4 font-medium text-gray-800">{p.plantilla.nombre}</td>
                  <td className="py-3 pr-4"><ChipEstado estado={p.estado} /></td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    {p.kmProximo
                      ? `${p.kmProximo.toLocaleString('es-CL')} km`
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    {p.fechaProxima
                      ? new Date(p.fechaProxima).toLocaleDateString('es-CL')
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => eliminar(p)}
                      disabled={eliminando === p.id}
                      className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                    >Quitar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <ModalAsignarPlan
          vehiculos={vehiculos}
          plantillas={plantillas}
          onClose={() => setModal(false)}
          onSaved={() => {
            setModal(false)
            if (selVeh) {
              api.get(`/flota/mantenciones/planes/${selVeh}`)
                .then(r => setPlanes(r.data || []))
                .catch(() => {})
            }
          }}
        />
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Mantenciones() {
  const [tab, setTab] = useState('plantillas')
  const [plantillas, setPlantillas] = useState([])

  // Cargar plantillas una vez (las necesita TabPlanFlota para el modal)
  useEffect(() => {
    api.get('/flota/mantenciones/plantillas')
      .then(r => setPlantillas(r.data || []))
      .catch(() => {})
  }, [])

  const tabs = [
    { id: 'plantillas', label: 'Plantillas' },
    { id: 'plan',       label: 'Plan de flota' },
  ]

  return (
    <div className="p-4 md:p-7 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Mantenciones programadas</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Configura intervalos y hace seguimiento de las mantenciones de tu flota
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-amber-400 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {tab === 'plantillas' && (
        <TabPlantillas />
      )}
      {tab === 'plan' && (
        <TabPlanFlota plantillas={plantillas} />
      )}
    </div>
  )
}
