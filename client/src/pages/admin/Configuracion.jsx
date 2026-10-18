import { useEffect, useState } from 'react'
import { Plus, Trash2, Loader2, Check } from 'lucide-react'
import AdminLayout from '../../components/AdminLayout'
import api from '../../lib/api'

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export default function Configuracion() {
  const [servicios, setServicios] = useState([])
  const [horarios, setHorarios] = useState([])
  const [nuevoServicio, setNuevoServicio] = useState({ nombre: '', duracion: 30 })
  const [guardandoServicios, setGuardandoServicios] = useState(false)
  const [guardandoHorarios, setGuardandoHorarios] = useState(false)
  const [okServicios, setOkServicios] = useState(false)
  const [okHorarios, setOkHorarios] = useState(false)

  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
  const tenantId = usuario.tenant?.id

  useEffect(() => {
    api.get(`/servicios?tenantId=${tenantId}`).then(res => setServicios(res.data))
    api.get(`/horarios?tenantId=${tenantId}`).then(res => {
      // Construir array con los 7 días, marcando activos
      const activos = res.data
      const todos = DIAS_SEMANA.map((nombre, i) => {
        const existente = activos.find(h => h.diaSemana === i)
        return existente || { diaSemana: i, horaInicio: '09:00', horaFin: '18:00', activo: false }
      })
      setHorarios(todos)
    })
  }, [tenantId])

  const agregarServicio = async () => {
    if (!nuevoServicio.nombre) return
    const res = await api.post('/servicios', nuevoServicio)
    setServicios(prev => [...prev, res.data])
    setNuevoServicio({ nombre: '', duracion: 30 })
  }

  const eliminarServicio = async (id) => {
    await api.delete(`/servicios/${id}`)
    setServicios(prev => prev.filter(s => s.id !== id))
  }

  const guardarHorarios = async () => {
    setGuardandoHorarios(true)
    try {
      await api.put('/horarios', { horarios: horarios.filter(h => h.activo) })
      setOkHorarios(true)
      setTimeout(() => setOkHorarios(false), 2000)
    } finally {
      setGuardandoHorarios(false)
    }
  }

  const toggleDia = (i) => {
    setHorarios(prev => prev.map((h, idx) => idx === i ? { ...h, activo: !h.activo } : h))
  }

  const updateHorario = (i, campo, valor) => {
    setHorarios(prev => prev.map((h, idx) => idx === i ? { ...h, [campo]: valor } : h))
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-xl font-bold text-gray-900">Configuración</h1>

        {/* Servicios */}
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Servicios</h2>

          <div className="space-y-2 mb-4">
            {servicios.map(s => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{s.nombre}</p>
                  <p className="text-xs text-gray-400">{s.duracion} minutos</p>
                </div>
                <button onClick={() => eliminarServicio(s.id)}
                  className="p-1.5 text-gray-300 hover:text-red-400 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Agregar servicio */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nombre del servicio"
              value={nuevoServicio.nombre}
              onChange={e => setNuevoServicio(p => ({ ...p, nombre: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && agregarServicio()}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={nuevoServicio.duracion}
              onChange={e => setNuevoServicio(p => ({ ...p, duracion: Number(e.target.value) }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {[15, 20, 30, 45, 60, 90, 120].map(d => (
                <option key={d} value={d}>{d} min</option>
              ))}
            </select>
            <button onClick={agregarServicio}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors">
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </section>

        {/* Horarios */}
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Horarios de atención</h2>

          <div className="space-y-3">
            {horarios.map((h, i) => (
              <div key={i} className={`flex items-center gap-3 py-2 ${!h.activo ? 'opacity-40' : ''}`}>
                <button onClick={() => toggleDia(i)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                    h.activo ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                  }`}>
                  {h.activo && <Check className="h-3 w-3 text-white" />}
                </button>
                <span className="text-sm font-medium text-gray-700 w-20 shrink-0">{DIAS_SEMANA[i]}</span>
                <input type="time" value={h.horaInicio}
                  disabled={!h.activo}
                  onChange={e => updateHorario(i, 'horaInicio', e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed" />
                <span className="text-gray-400 text-sm">a</span>
                <input type="time" value={h.horaFin}
                  disabled={!h.activo}
                  onChange={e => updateHorario(i, 'horaFin', e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed" />
              </div>
            ))}
          </div>

          <button onClick={guardarHorarios} disabled={guardandoHorarios}
            className={`mt-5 w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
              okHorarios
                ? 'bg-green-500 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-300'
            }`}>
            {guardandoHorarios
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
              : okHorarios
              ? <><Check className="h-4 w-4" /> Guardado</>
              : 'Guardar horarios'}
          </button>
        </section>
      </div>
    </AdminLayout>
  )
}
