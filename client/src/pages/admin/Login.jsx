import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Car, Eye, EyeOff, ExternalLink, ShieldCheck, Wrench } from 'lucide-react'
import { Turnstile } from '@marsidev/react-turnstile'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { estaAutenticado, saveSession } from '../../lib/auth'
import { getApiErrorMessage } from '../../lib/errors'
import { iniciarSesion } from '../../services/authService'
import { Alert, Button, FormField, Input } from '../../components/ui'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState(null)
  const turnstileRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/admin'

  useDocumentTitle('Ingresar — AgendaCar')

  useEffect(() => {
    if (estaAutenticado()) navigate(from, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.email.trim() || !form.password) {
      setError('Ingresa tu correo y contraseña para continuar.')
      return
    }

    if (!turnstileToken) {
      setError('Espera la verificación de seguridad e intenta de nuevo.')
      return
    }

    setLoading(true)
    try {
      const data = await iniciarSesion({
        email: form.email.trim(),
        password: form.password,
        turnstileToken
      })
      saveSession(data)
      navigate(from, { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Email o contraseña incorrectos'))
      turnstileRef.current?.reset()
      setTurnstileToken(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside className="relative hidden overflow-hidden bg-graphite-950 p-10 text-white lg:flex lg:flex-col">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              'linear-gradient(#8C939D 1px, transparent 1px), linear-gradient(90deg, #8C939D 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }}
          aria-hidden="true"
        />
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-400 text-white">
            <Car className="h-4 w-4" aria-hidden="true" />
          </div>
          <span className="text-base font-bold tracking-tight">AgendaCar</span>
          <span className="ml-1 rounded border border-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">
            Admin
          </span>
        </div>

        <div className="relative my-auto max-w-md py-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-300">
            Software para talleres
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight">
            Tu agenda, tus clientes y tus servicios, bajo control.
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">
            Administra las reservas del día, confirma atenciones y mantén la disponibilidad
            de tu taller siempre al día.
          </p>

          <div className="mt-10 grid gap-3">
            <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent-300" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold">Acceso privado del taller</p>
                <p className="mt-0.5 text-xs leading-relaxed text-white/50">
                  Las reservas y la configuración solo están disponibles para usuarios autorizados.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-accent-300" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold">Operación diaria</p>
                <p className="mt-0.5 text-xs leading-relaxed text-white/50">
                  Revisa la agenda por día o semana y actualiza el estado de cada atención.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-white/35">
          Panel de administración · AgendaCar
        </p>
      </aside>

      <main className="flex flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink focus-ring"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver al sitio
          </Link>
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-graphite-900 text-white">
              <Car className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="text-sm font-bold text-ink">AgendaCar</span>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <p className="micro-label">Acceso administrador</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Ingresa a tu panel
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            Usa las credenciales de tu taller para continuar.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
            {error && (
              <Alert variant="error" onDismiss={() => setError('')}>
                {error}
              </Alert>
            )}

            <FormField id="email" label="Correo electrónico" required>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                required
                value={form.email}
                onChange={event => setForm(prev => ({ ...prev, email: event.target.value }))}
                placeholder="admin@mitaller.cl"
              />
            </FormField>

            <FormField id="password" label="Contraseña" required>
              <div className="relative">
                <Input
                  id="password"
                  type={mostrarPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={event => setForm(prev => ({ ...prev, password: event.target.value }))}
                  placeholder="••••••••"
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(value => !value)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1.5 text-ink-muted transition-colors hover:bg-graphite-100 hover:text-ink focus-ring"
                  aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {mostrarPassword
                    ? <EyeOff className="h-4 w-4" aria-hidden="true" />
                    : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </FormField>

            <Turnstile
              ref={turnstileRef}
              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
              onSuccess={token => setTurnstileToken(token)}
              onExpire={() => setTurnstileToken(null)}
              onError={() => setTurnstileToken(null)}
              options={{ theme: 'light', size: 'flexible' }}
            />

            <Button
              type="submit"
              variant="dark"
              size="lg"
              loading={loading}
              disabled={loading || !turnstileToken}
              rightIcon={loading ? undefined : ArrowRight}
              className="w-full"
            >
              {loading ? 'Ingresando…' : 'Ingresar al panel'}
            </Button>
          </form>

          <div className="mt-6 border-t border-line pt-5 space-y-4">
            <Link
              to="/"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-graphite-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-graphite-800 focus-ring"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Ver sitio público · Agendar hora
            </Link>
            <p className="text-xs leading-relaxed text-ink-muted">
              ¿Necesitas acceso o recuperar tu contraseña? Contacta al administrador de tu taller.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-ink-soft">
          AgendaCar · Gestión de reservas para talleres
        </p>
      </main>
    </div>
  )
}

