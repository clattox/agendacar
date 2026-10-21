import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, LogOut, KeyRound, ChevronDown, CheckCircle2 } from 'lucide-react'
import { clearSession, getUsuario } from '../../lib/auth'
import { cambiarPassword } from '../../services/authService'
import { getApiErrorMessage } from '../../lib/errors'
import { Button, Input } from '../ui'

export default function SuperadminLayout({ children }) {
  const navigate = useNavigate()
  const usuario = getUsuario() || {}

  const [open, setOpen] = useState(false)
  const [formPass, setFormPass] = useState({ actual: '', nueva: '', confirmar: '' })
  const [errorPass, setErrorPass] = useState('')
  const [okPass, setOkPass] = useState(false)
  const [guardandoPass, setGuardandoPass] = useState(false)

  const dropdownRef = useRef(null)

  // Cierra al hacer clic fuera
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleLogout = () => {
    clearSession()
    navigate('/superadmin/login', { replace: true })
  }

  const handleCambiarPassword = async (e) => {
    e.preventDefault()
    setErrorPass('')
    setOkPass(false)
    if (!formPass.actual) return setErrorPass('Ingresa tu contraseña actual.')
    if (formPass.nueva.length < 8) return setErrorPass('Mínimo 8 caracteres.')
    if (formPass.nueva !== formPass.confirmar) return setErrorPass('Las contraseñas no coinciden.')
    if (guardandoPass) return
    setGuardandoPass(true)
    try {
      await cambiarPassword({ passwordActual: formPass.actual, passwordNueva: formPass.nueva })
      setOkPass(true)
      setFormPass({ actual: '', nueva: '', confirmar: '' })
      window.setTimeout(() => { setOkPass(false); setOpen(false) }, 2000)
    } catch (err) {
      setErrorPass(getApiErrorMessage(err, 'No pudimos cambiar la contraseña.'))
    } finally {
      setGuardandoPass(false)
    }
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
          {/* Botón email → dropdown cambiar contraseña */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen(v => !v)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-ink-muted hover:bg-graphite-100 hover:text-ink transition-colors"
              aria-expanded={open}
            >
              <span>{usuario.email}</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-line bg-surface shadow-xl z-50">
                <div className="flex items-center gap-2 border-b border-line px-4 py-3">
                  <KeyRound className="h-4 w-4 text-ink-muted" />
                  <p className="text-sm font-semibold text-ink">Cambiar contraseña</p>
                </div>
                <form onSubmit={handleCambiarPassword} className="p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">Contraseña actual</label>
                    <Input
                      type="password"
                      value={formPass.actual}
                      onChange={e => setFormPass(p => ({ ...p, actual: e.target.value }))}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">Nueva contraseña</label>
                    <Input
                      type="password"
                      value={formPass.nueva}
                      onChange={e => setFormPass(p => ({ ...p, nueva: e.target.value }))}
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">Confirmar nueva</label>
                    <Input
                      type="password"
                      value={formPass.confirmar}
                      onChange={e => setFormPass(p => ({ ...p, confirmar: e.target.value }))}
                      placeholder="Repite la nueva contraseña"
                      autoComplete="new-password"
                    />
                  </div>

                  {errorPass && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{errorPass}</p>
                  )}
                  {okPass && (
                    <p className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Contraseña actualizada.
                    </p>
                  )}

                  <Button type="submit" loading={guardandoPass} leftIcon={KeyRound} size="sm" className="w-full">
                    Cambiar contraseña
                  </Button>
                </form>
              </div>
            )}
          </div>

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
