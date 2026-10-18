import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle, Calendar, Clock, Car, Phone, Home } from 'lucide-react'

export default function Confirmacion() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { reserva, tenant } = state || {}

  if (!reserva) {
    navigate('/')
    return null
  }

  const fecha = new Date(reserva.fecha)
  const fechaFormateada = fecha.toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
  const horaFormateada = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="max-w-lg mx-auto px-4 py-12 flex-1 flex flex-col items-center">

        {/* Icono éxito */}
        <div className="mb-6">
          <CheckCircle className="h-20 w-20 text-green-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          ¡Reserva confirmada!
        </h1>
        <p className="text-gray-500 text-center mb-8">
          Te esperamos en {tenant?.nombre}
        </p>

        {/* Detalles */}
        <div className="w-full bg-white rounded-2xl shadow-sm p-6 space-y-4 mb-8">
          <DetalleItem icon={Car} label="Servicio" value={reserva.servicio?.nombre} />
          <DetalleItem icon={Calendar} label="Fecha" value={fechaFormateada} />
          <DetalleItem icon={Clock} label="Hora" value={horaFormateada} />
          <DetalleItem icon={Car} label="Patente" value={reserva.patente} />
          {tenant?.telefono && (
            <DetalleItem icon={Phone} label="Teléfono taller" value={tenant.telefono} />
          )}
        </div>

        <p className="text-sm text-gray-400 text-center mb-8">
          Si necesitas cancelar o reagendar, contáctanos directamente.
        </p>

        <button
          onClick={() => navigate('/')}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
          <Home className="h-5 w-5" />
          Volver al inicio
        </button>
      </main>
    </div>
  )
}

function DetalleItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-blue-50 rounded-lg mt-0.5">
        <Icon className="h-4 w-4 text-blue-600" />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-gray-900 font-medium capitalize">{value}</p>
      </div>
    </div>
  )
}
