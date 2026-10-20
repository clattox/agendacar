import { useEffect, useState } from 'react'
import { Building2, CalendarClock, CheckCircle2, Pencil, Plus, PowerOff, Users, X } from 'lucide-react'
import SuperadminLayout from '../../components/superadmin/SuperadminLayout'
import { getTenants, createTenant, toggleTenant, getStats, actualizarVencimiento } from '../../services/superadminService'
import { Button, Input } from '../../components/ui'

const EMPTY_FORM = {
  nombre: '', subdominio: '', email: '', telefono: '',
  adminNombre: '', adminEmail: '', adminPassword: ''
}

export default function SuperadminDashboard() {
  const [tenants, setTenants] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [toggling, setToggling] = useState(null)
  const [editandoVenc, setEditandoVenc] = useState(null) // id del tenant editando
  const [vencInput, setVencInput] = useState('')
  const [guardandoVenc, setGuardandoVenc] = useState(false)

  useEffect(() => {
    Promise.all([getTenants(), getStats()])
      .then(([t, s]) => { setTenants(t); setStats(s) })
      .catch(() => setError('No pudimos cargar los datos.'))
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (guardando) return
    setGuardando(true)
    setFormError('')
    try {
      const tenant = await createTenant(form)
      setTenants(prev => [tenant, ...prev])
      setStats(prev => prev ? { ...prev, totalTenants: prev.totalTenants + 1, tenantActivos: prev.tenantActivos + 1 } : prev)
      setForm(EMPTY_FORM)
      setShowForm(false)
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error al crear el taller.')
    } finally {
      setGuardando(false)
    }
  }

  const handleToggle = async (id) => {
    if (toggling) return
    setToggling(id)
    try {
      const actualizado = await toggleTenant(id)
      setTenants(prev => prev.map(t => t.id === id ? actualizado : t))
      setStats(prev => {
        if (!prev) return prev
        const delta = actualizado.activo ? 1 : -1
        return { ...prev, tenantActivos: prev.tenantActivos + delta }
      })
    } catch {
      setError('No pudimos actualizar el estado.')
    } finally {
      setToggling(null)
    }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const iniciarEditVenc = (t) => {
    setEditandoVenc(t.id)
    setVencInput(t.vencimiento ? t.vencimiento.split('T')[0] : '')
  }

  const guardarVenc = async (id, valorOverride) => {
    if (guardandoVenc) return
    setGuardandoVenc(true)
    const valor = valorOverride !== undefined ? valorOverride : vencInput
    try {
      const actualizado = await actualizarVencimiento(id, valor || null)
      setTenants(prev => prev.map(t => t.id === id ? actualizado : t))
      setEditandoVenc(null)
    } catch {
      setError('No pudimos actualizar el vencimiento.')
    } finally {
      setGuardandoVenc(false)
    }
  }

  const vencimientoLabel = (venc) => {
    if (!venc) return null
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const fecha = new Date(venc)
    const diff = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24))
    const str = fecha.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    if (diff < 0) return { str, color: 'text-red-600 bg-red-50', label: `Vencido (${str})` }
    if (diff <= 7) return { str, color: 'text-orange-600 bg-orange-50', label: `Vence en ${diff}d (${str})` }
    return { str, color: 'text-ink-muted bg-graphite-100', label: str }
  }

  return (
    <SuperadminLayout>
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft">Superadmin</p>
          <h1 className="mt-1 text-2xl font-bold text-ink">Talleres registrados</h1>
        </div>
        <Button leftIcon={Plus} onClick={() => setShowForm(true)} size="sm">
          Nuevo taller
        </Button>
      </header>

      {/* Stats */}
      {stats && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[
            { label: 'Talleres totales', value: stats.totalTenants, icon: Building2 },
            { label: 'Talleres activos', value: stats.tenantActivos, icon: CheckCircle2 },
            { label: 'Reservas totales', value: stats.totalReservas, icon: Users },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-line bg-surface px-4 py-4 shadow-card">
              <div className="flex items-center gap-2 text-ink-muted">
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium">{label}</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {/* Formulario nuevo taller */}
      {showForm && (
        <div className="mt-6 rounded-xl border border-line bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-ink">Nuevo taller</h2>
            <button onClick={() => { setShowForm(false); setFormError(''); setForm(EMPTY_FORM) }}
              className="text-ink-soft hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          </div>
          {formError && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
          )}
          <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">Nombre del taller *</label>
              <Input value={form.nombre} onChange={e => f('nombre', e.target.value)} placeholder="Taller Rodríguez" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">Subdominio *</label>
              <Input value={form.subdominio} onChange={e => f('subdominio', e.target.value.toLowerCase())} placeholder="rodriguez" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">Email del taller *</label>
              <Input type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="contacto@taller.cl" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">Teléfono</label>
              <Input value={form.telefono} onChange={e => f('telefono', e.target.value)} placeholder="+56 9 1234 5678" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">Fecha de vencimiento</label>
              <Input type="date" value={form.vencimiento || ''} onChange={e => f('vencimiento', e.target.value)} />
            </div>
            <div className="sm:col-span-2 border-t border-line pt-3 mt-1">
              <p className="text-xs font-semibold text-ink-muted mb-3 uppercase tracking-wide">Cuenta admin del taller</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">Nombre admin</label>
              <Input value={form.adminNombre} onChange={e => f('adminNombre', e.target.value)} placeholder="Carlos Rodríguez" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">Email admin *</label>
              <Input type="email" value={form.adminEmail} onChange={e => f('adminEmail', e.target.value)} placeholder="admin@taller.cl" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">Contraseña admin *</label>
              <Input type="password" value={form.adminPassword} onChange={e => f('adminPassword', e.target.value)} placeholder="••••••••" required />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2 mt-1">
              <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}>
                Cancelar
              </Button>
              <Button type="submit" loading={guardando} leftIcon={Plus}>
                Crear taller
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de tenants */}
      <div className="mt-6 rounded-xl border border-line bg-surface shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-sm text-ink-muted">Cargando…</div>
        ) : tenants.length === 0 ? (
          <div className="p-6 text-center text-sm text-ink-muted">No hay talleres registrados.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-graphite-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide">Taller</th>
                <th className="px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide hidden sm:table-cell">Subdominio</th>
                <th className="px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide hidden md:table-cell">Reservas</th>
                <th className="px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide hidden lg:table-cell">Vencimiento</th>
                <th className="px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tenants.map(t => (
                <tr key={t.id} className="hover:bg-graphite-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{t.nombre}</p>
                    <p className="text-xs text-ink-muted">{t.email}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <code className="text-xs bg-graphite-100 px-1.5 py-0.5 rounded">{t.subdominio}</code>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-ink-muted">
                    {t._count?.reservas ?? 0}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {editandoVenc === t.id ? (
                      <div className="flex items-center gap-1.5">
                        <Input type="date" value={vencInput} onChange={e => setVencInput(e.target.value)} className="text-xs py-1 h-7" />
                        <button onClick={() => guardarVenc(t.id)} disabled={guardandoVenc}
                          className="rounded px-2 py-1 text-xs bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-50">
                          OK
                        </button>
                        <button onClick={() => guardarVenc(t.id, '')} disabled={guardandoVenc}
                          title="Quitar fecha"
                          className="rounded px-1.5 py-1 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50">
                          Sin fecha
                        </button>
                        <button onClick={() => setEditandoVenc(null)}
                          className="rounded px-1.5 py-1 text-xs text-ink-soft hover:bg-graphite-100">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 group">
                        {t.vencimiento ? (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${vencimientoLabel(t.vencimiento)?.color}`}>
                            <CalendarClock className="h-3 w-3" />
                            {vencimientoLabel(t.vencimiento)?.label}
                          </span>
                        ) : (
                          <span className="text-xs text-ink-soft">Sin fecha</span>
                        )}
                        <button onClick={() => iniciarEditVenc(t)}
                          className="opacity-0 group-hover:opacity-100 text-ink-soft hover:text-ink transition-opacity">
                          <Pencil className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      t.activo ? 'bg-green-50 text-green-700' : 'bg-graphite-100 text-ink-soft'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${t.activo ? 'bg-green-500' : 'bg-graphite-400'}`} />
                      {t.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleToggle(t.id)}
                      disabled={toggling === t.id}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                        t.activo
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-green-700 hover:bg-green-50'
                      }`}
                    >
                      <PowerOff className="h-3.5 w-3.5" />
                      {t.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </SuperadminLayout>
  )
}
