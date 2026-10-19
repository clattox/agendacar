import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  Car,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Settings
} from 'lucide-react'
import { clearSession, getUsuario } from '../../lib/auth'
import TenantAvatar from '../public/TenantAvatar'

const nav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Panel', exact: true },
  { to: '/admin/agenda', icon: CalendarDays, label: 'Agenda' },
  { to: '/admin/configuracion', icon: Settings, label: 'Configuración' }
]

export default function AdminLayout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const usuario = getUsuario() || {}
  const tenant = usuario.tenant

  const handleLogout = () => {
    clearSession()
    navigate('/admin/login', { replace: true })
  }

  const isActive = (to, exact) =>
    exact ? location.pathname === to : location.pathname.startsWith(to)

  return (
    <div className="min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-surface md:flex">
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-graphite-900 text-white">
            <Car className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight tracking-tight text-ink">AgendaCar</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
              Panel taller
            </p>
          </div>
        </div>

        <div className="border-b border-line px-4 py-3">
          <div className="flex items-center gap-2.5">
            <TenantAvatar tenant={tenant} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {tenant?.nombre || 'Taller'}
              </p>
              <p className="truncate text-xs text-ink-muted">{usuario.email || 'Administrador'}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3" aria-label="Navegación principal">
          {nav.map(({ to, icon: Icon, label, exact }) => {
            const active = isActive(to, exact)
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors focus-ring ${
                  active
                    ? 'bg-graphite-900 text-white'
                    : 'text-ink-muted hover:bg-graphite-100 hover:text-ink'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="space-y-1 border-t border-line p-3">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-graphite-100 hover:text-ink focus-ring"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Ver sitio público
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-danger-50 hover:text-danger-600 focus-ring"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 md:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <TenantAvatar tenant={tenant} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{tenant?.nombre || 'AgendaCar'}</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
              Panel del taller
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line px-3 text-xs font-semibold text-ink-muted transition-colors hover:bg-graphite-50 hover:text-ink focus-ring"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          Salir
        </button>
      </header>

      <div className="md:pl-60">
        <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-5 sm:px-6 md:pb-10 md:pt-8">
          {children}
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-surface md:hidden"
        aria-label="Navegación principal"
      >
        {nav.map(({ to, icon: Icon, label, exact }) => {
          const active = isActive(to, exact)
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${
                active ? 'text-accent-600' : 'text-ink-soft hover:text-ink'
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
