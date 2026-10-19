import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, Car, ChevronRight } from 'lucide-react'
import api from '../../lib/api'

export default function Inicio() {
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Obtener subdominio del hostname
  const hostname = window.location.hostname; const parts = hostname.split('.'); const subdominio = parts.length > 1 && parts[0] !== 'www' ? parts[0] : 'demo'

  useEffect(() => {
    api.get(`/tenant?subdominio=${subdominio}`)
      .then(res => setTenant(res.data))
      .catch(() => setTenant(null))
      .finally(() => setLoading(false))
  }, [subdominio])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )

  if (!tenant) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500">Taller no encontrado.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-5 flex items-center gap-3">
          {tenant.logoUrl
            ? <img src={tenant.logoUrl} alt={tenant.nombre} className="h-10 w-10 rounded-full object-cover" />
            : <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                {tenant.nombre[0]}
              </div>
          }
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-tight">{tenant.nombre}</h1>
            {tenant.telefono && (
              <p className="text-sm text-gray-500">{tenant.telefono}</p>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-lg mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Agenda tu hora en línea
          </h2>
          <p className="text-gray-500">
            Sin llamadas, sin esperas. Elige el servicio y la hora que más te acomode.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { icon: Calendar, label: 'Elige tu día' },
            { icon: Clock, label: 'Elige tu hora' },
            { icon: Car, label: 'Llegа y listo' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="bg-white rounded-xl p-4 text-center shadow-sm">
              <Icon className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate('/reservar', { state: { tenant } })}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors text-lg shadow-md"
        >
          Reservar hora
          <ChevronRight className="h-5 w-5" />
        </button>
      </main>
    </div>
  )
}
