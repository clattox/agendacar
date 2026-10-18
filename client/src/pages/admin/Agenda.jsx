import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react'
import AdminLayout from '../../components/AdminLayout'
import api from '../../lib/api'

const ESTADOS = {
  confirmada: { label: 'Confirmada', color: 'bg-blue-100 text-blue-700' },
  atendida:   { label: 'Atendida',   color: 'bg-green-100 text-green-700' },
  cancelada:  { label: 'Cancelada',  color: 'bg-gray-100 text-gray-400 line-through' },
}

export default function Agenda() {
  const [fecha, setFecha] = useState(new Date())
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)

  const fechaStr = fecha.toISOString().split('T')[0]

  const cargar = () => {
    setLoading(true)
    api.get(`/reservas?fecha=${fechaStr}`)
      .then(res => setReservas(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [fechaStr])

  const cambiarEstado = async (id, estado) => {
    await api.patch(`/reservas/${id}/estado`, { estado })
    cargar()
  }

  const cambiarDia = (dir) => {
    setFecha(prev => {
      const d = new Date(prev)
      d.setDate(d.getDate() + dir)
      return d
    })
  }

  const esHoy = fecha.toDateString() === new Date().toDateString()

  const fechaFormateada = fecha.toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        {/* Navegación de fecha */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => cambiarDia(-1)}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>

          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-900 capitalize">{fechaFormateada}</h1>
            {!esHoy && (
              <button onClick={() => setFecha(new Date())}
                className="text-xs text-blue-600 font-medium hover:underline">
                Volver a hoy
              </button>
            )}
          </div>

          <button onClick={() => cambiarDia(1)}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : reservas.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <Clock className="h-10 w-10 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400">Sin reservas para este día</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reservas.map(r => {
              const hora = new Date(r.fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
              const estado = ESTADOS[r.estado]
              return (
                <div key={r.id}
                  className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${
                    r.estado === 'atendida' ? 'border-green-400' :
                    r.estado === 'cancelada' ? 'border-gray-200' :
                    'border-blue-400'
                  }`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-50 rounded-xl px-3 py-2 text-center min-w-[52px]">
                        <p className="text-lg font-bold text-gray-900 leading-tight">{hora}</p>
                        <p className="text-xs text-gray-400">{r.servicio?.duracion}min</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{r.nombre}</p>
                        <p className="text-sm text-gray-500">{r.patente} · {r.servicio?.nombre}</p>
                        <p className="text-sm text-gray-400">{r.telefono}</p>
                        {r.email && <p className="text-sm text-gray-400">{r.email}</p>}
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${estado.color}`}>
                      {estado.label}
                    </span>
                  </div>

                  {r.estado === 'confirmada' && (
                    <div className="flex gap-2 pt-3 border-t border-gray-50">
                      <button onClick={() => cambiarEstado(r.id, 'atendida')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 transition-colors">
                        <CheckCircle className="h-4 w-4" />
                        Atendida
                      </button>
                      <button onClick={() => cambiarEstado(r.id, 'cancelada')}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gray-50 text-gray-500 text-sm font-medium hover:bg-gray-100 transition-colors">
                        <XCircle className="h-4 w-4" />
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
