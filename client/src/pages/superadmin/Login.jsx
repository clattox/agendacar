import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import api from '../../lib/api'
import { saveSession } from '../../lib/auth'
import { Button, Input } from '../../components/ui'

export default function SuperadminLogin() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/login', form)
      if (data.usuario?.rol !== 'superadmin') {
        setError('No tienes permisos de superadmin.')
        return
      }
      saveSession(data)
      navigate('/superadmin', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciales incorrectas.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-graphite-900 text-white">
            <Shield className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-ink">Superadmin</h1>
            <p className="mt-0.5 text-sm text-ink-muted">AgendaCar — Panel de control</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-surface p-6 shadow-card space-y-4">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
          <div className="space-y-1">
            <label className="text-xs font-medium text-ink-muted">Email</label>
            <Input
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="superadmin@agendacar.cl"
              required
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-ink-muted">Contraseña</label>
            <Input
              type="password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              placeholder="••••••••"
              required
            />
          </div>
          <Button type="submit" className="w-full" loading={loading}>
            Ingresar
          </Button>
        </form>
      </div>
    </div>
  )
}
