import { useEffect, useState } from 'react'
import { Calendar, Clock, CheckCircle, XCircle } from 'lucide-react'
import AdminLayout from '../../components/AdminLayout'
import api from '../../lib/api'

const ESTADOS = {
  confirmada: { label: 'Confirmada', color: 'bg-blue-100 text-blue-700' },
  atendida:   { label: 'Atendida',   color: 'bg-green-100 text-green-700' },
  cancelada:  { label: 'Cancelada',  color: 'bg-gray-100 text-gray-500' },
}

export default function Dashboard() {
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)

  const hoy = new Date().toISOString().split('T')[0]

  const cargar = () => {
    setLoading(true)
    api.get(`/reservas?fecha=${hoy}`)
      .then(res => setReservas(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const cambiarEstado = async (id, estado) => {
    await api.patch(`/reservas/${id}/estado`, { estado })
    cargar()
  }

  const confirmadas = reservas.filter(r => r.estado === 'confirmada').length
  const atendidas   = reservas.filter(r => r.estado === 'atendida').length

  const fechaHoy = new Date().toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 capitalize">{fechaHoy}</h1>
          <p className="text-gray-400 text-sm">Resumen del día</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-gray-400 font-medium">Pendientes</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{confirmadas}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-gray-400 font-medium">Atendidas</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{atendidas}</p>
          </div>
        </div>

        {/* Lista reservas */}
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Reservas de hoy
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : reservas.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <Calendar className="h-10 w-10 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400">No hay reservas para hoy</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reservas.map(r => {
              const hora = new Date(r.fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
              const estado = ESTADOS[r.estado]
              return (
                <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="text-center bg-gray-50 rounded-xl px-3 py-2 min-w-[52px]">
                        <p className="text-lg font-bold text-gray-900 leading-tight">{hora}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{r.nombre}</p>
                        <p className="text-sm text-gray-400">{r.patente} · {r.servicio?.nombre}</p>
                        <p className="text-sm text-gray-400">{r.telefono}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${estado.color}`}>
                      {estado.label}
                    </span>
                  </div>

                  {/* Acciones */}
                  {r.estado === 'confirmada' && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                      <button
                        onClick={() => cambiarEstado(r.id, 'atendida')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 transition-colors">
                        <CheckCircle className="h-4 w-4" />
                        Marcar atendida
                      </button>
                      <button
                        onClick={() => cambiarEstado(r.id, 'cancelada')}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 text-gray-500 text-sm font-medium hover:bg-gray-100 transition-colors">
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
