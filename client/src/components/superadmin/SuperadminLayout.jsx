import { useNavigate } from 'react-router-dom'
import { Shield, LogOut } from 'lucide-react'
import { clearSession, getUsuario } from '../../lib/auth'

export default function SuperadminLayout({ children }) {
  const navigate = useNavigate()
  const usuario = getUsuario() || {}

  const handleLogout = () => {
    clearSession()
    navigate('/superadmin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-6 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-graphite-900 text-white">
            <Shield className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-ink">AgendaCar</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
              Superadmin
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-muted">{usuario.email}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-ink-soft hover:bg-graphite-100 hover:text-ink transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  )
}
