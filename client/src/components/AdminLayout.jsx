import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Calendar, LayoutDashboard, Settings, LogOut, Car } from 'lucide-react'

const nav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/admin/agenda', icon: Calendar, label: 'Agenda' },
  { to: '/admin/configuracion', icon: Settings, label: 'Configuración' },
]

export default function AdminLayout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    navigate('/admin/login')
  }

  const isActive = (to, exact) => exact
    ? location.pathname === to
    : location.pathname.startsWith(to)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 fixed h-full">
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Car className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">AgendaCar</span>
          </div>
          <p className="text-xs text-gray-400 mt-1 truncate">{usuario.tenant?.nombre}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, icon: Icon, label, exact }) => (
            <Link key={to} to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${isActive(to, exact)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'}`}>
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Usuario */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2 px-3 py-2 mb-1">
            <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
              {usuario.nombre?.[0]}
            </div>
            <span className="text-sm text-gray-700 truncate">{usuario.nombre}</span>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Nav mobile bottom */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-10">
        {nav.map(({ to, icon: Icon, label, exact }) => (
          <Link key={to} to={to}
            className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors
              ${isActive(to, exact) ? 'text-blue-600' : 'text-gray-400'}`}>
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
