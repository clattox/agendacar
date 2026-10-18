import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import api from '../../lib/api'

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function Reservar() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const tenant = state?.tenant

  const [paso, setPaso] = useState(1) // 1: servicio, 2: fecha, 3: hora, 4: datos
  const [servicios, setServicios] = useState([])
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null)
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null)
  const [horaSeleccionada, setHoraSeleccionada] = useState(null)
  const [horasDisponibles, setHorasDisponibles] = useState([])
  const [mesActual, setMesActual] = useState(new Date())
  const [form, setForm] = useState({ nombre: '', telefono: '', email: '', patente: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!tenant) { navigate('/'); return }
    api.get(`/servicios?tenantId=${tenant.id}`)
      .then(res => setServicios(res.data))
  }, [tenant])

  useEffect(() => {
    if (!fechaSeleccionada || !servicioSeleccionado) return
    const fecha = formatFecha(fechaSeleccionada)
    api.get(`/reservas/disponibles?tenantId=${tenant.id}&fecha=${fecha}&servicioId=${servicioSeleccionado.id}`)
      .then(res => setHorasDisponibles(res.data.horasDisponibles))
  }, [fechaSeleccionada, servicioSeleccionado])

  const formatFecha = (date) => date.toISOString().split('T')[0]

  const diasDelMes = () => {
    const año = mesActual.getFullYear()
    const mes = mesActual.getMonth()
    const primerDia = new Date(año, mes, 1).getDay()
    const totalDias = new Date(año, mes + 1, 0).getDate()
    const hoy = new Date(); hoy.setHours(0,0,0,0)

    const dias = []
    for (let i = 0; i < primerDia; i++) dias.push(null)
    for (let d = 1; d <= totalDias; d++) {
      const fecha = new Date(año, mes, d)
      dias.push({ fecha, pasado: fecha < hoy, esDomingo: fecha.getDay() === 0 })
    }
    return dias
  }

  const cambiarMes = (dir) => {
    setMesActual(prev => new Date(prev.getFullYear(), prev.getMonth() + dir, 1))
  }

  const handleSubmit = async () => {
    if (!form.nombre || !form.telefono || !form.patente) {
      setError('Completa nombre, teléfono y patente')
      return
    }
    setLoading(true)
    setError('')
    try {
      const fecha = formatFecha(fechaSeleccionada)
      const res = await api.post('/reservas/nueva', {
        tenantId: tenant.id,
        ...form,
        patente: form.patente.toUpperCase(),
        fecha,
        hora: horaSeleccionada,
        servicioId: servicioSeleccionado.id
      })
      navigate('/confirmacion', { state: { reserva: res.data, tenant } })
    } catch {
      setError('Hubo un error al reservar. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  if (!tenant) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => paso > 1 ? setPaso(p => p - 1) : navigate('/')}
            className="p-1 rounded-lg hover:bg-gray-100">
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="font-bold text-gray-900">{tenant.nombre}</h1>
            <p className="text-xs text-gray-400">
              {paso === 1 && 'Selecciona el servicio'}
              {paso === 2 && 'Selecciona la fecha'}
              {paso === 3 && 'Selecciona la hora'}
              {paso === 4 && 'Tus datos'}
            </p>
          </div>
        </div>
        {/* Barra de progreso */}
        <div className="h-1 bg-gray-100">
          <div className="h-1 bg-blue-600 transition-all duration-300"
            style={{ width: `${(paso / 4) * 100}%` }} />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">

        {/* PASO 1: Servicio */}
        {paso === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">¿Qué necesitas?</h2>
            <div className="space-y-3">
              {servicios.map(s => (
                <button key={s.id}
                  onClick={() => { setServicioSeleccionado(s); setPaso(2) }}
                  className="w-full bg-white rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md hover:border-blue-200 border border-transparent transition-all text-left">
                  <div>
                    <p className="font-medium text-gray-900">{s.nombre}</p>
                    <p className="text-sm text-gray-400">{s.duracion} minutos</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PASO 2: Fecha */}
        {paso === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">¿Qué día?</h2>
            <div className="bg-white rounded-xl shadow-sm p-4">
              {/* Navegación mes */}
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => cambiarMes(-1)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <span className="font-semibold text-gray-900">
                  {MESES[mesActual.getMonth()]} {mesActual.getFullYear()}
                </span>
                <button onClick={() => cambiarMes(1)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              {/* Días semana */}
              <div className="grid grid-cols-7 mb-2">
                {DIAS.map(d => (
                  <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
                ))}
              </div>
              {/* Días mes */}
              <div className="grid grid-cols-7 gap-1">
                {diasDelMes().map((dia, i) => {
                  if (!dia) return <div key={i} />
                  const seleccionado = fechaSeleccionada?.toDateString() === dia.fecha.toDateString()
                  return (
                    <button key={i}
                      disabled={dia.pasado || dia.esDomingo}
                      onClick={() => { setFechaSeleccionada(dia.fecha); setHoraSeleccionada(null); setPaso(3) }}
                      className={`
                        aspect-square rounded-lg text-sm font-medium transition-colors
                        ${seleccionado ? 'bg-blue-600 text-white' : ''}
                        ${dia.pasado || dia.esDomingo ? 'text-gray-200 cursor-not-allowed' : 'hover:bg-blue-50 text-gray-900'}
                      `}>
                      {dia.fecha.getDate()}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* PASO 3: Hora */}
        {paso === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">¿A qué hora?</h2>
            <p className="text-sm text-gray-400 mb-4">
              {fechaSeleccionada?.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            {horasDisponibles.length === 0
              ? <div className="bg-white rounded-xl p-6 text-center shadow-sm">
                  <p className="text-gray-500">No hay horas disponibles para este día.</p>
                  <button onClick={() => setPaso(2)} className="mt-3 text-blue-600 text-sm font-medium">
                    Elegir otro día
                  </button>
                </div>
              : <div className="grid grid-cols-3 gap-3">
                  {horasDisponibles.map(hora => (
                    <button key={hora}
                      onClick={() => { setHoraSeleccionada(hora); setPaso(4) }}
                      className={`
                        py-3 rounded-xl text-sm font-semibold border transition-colors
                        ${horaSeleccionada === hora
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-900 border-gray-200 hover:border-blue-400'}
                      `}>
                      {hora}
                    </button>
                  ))}
                </div>
            }
          </div>
        )}

        {/* PASO 4: Datos */}
        {paso === 4 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tus datos</h2>

            {/* Resumen */}
            <div className="bg-blue-50 rounded-xl p-4 mb-6 text-sm">
              <p className="font-semibold text-blue-900">{servicioSeleccionado?.nombre}</p>
              <p className="text-blue-700">
                {fechaSeleccionada?.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })} — {horaSeleccionada}
              </p>
            </div>

            <div className="space-y-4">
              {[
                { key: 'nombre', label: 'Nombre completo', placeholder: 'Juan Pérez', required: true },
                { key: 'telefono', label: 'Teléfono', placeholder: '+56 9 1234 5678', required: true, type: 'tel' },
                { key: 'email', label: 'Email (opcional)', placeholder: 'juan@email.com', type: 'email' },
                { key: 'patente', label: 'Patente del vehículo', placeholder: 'ABCD12', required: true, upper: true },
              ].map(({ key, label, placeholder, required, type, upper }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type={type || 'text'}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: upper ? e.target.value.toUpperCase() : e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ))}
            </div>

            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
              {loading
                ? <><Loader2 className="h-5 w-5 animate-spin" /> Reservando...</>
                : 'Confirmar reserva'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
