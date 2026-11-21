// pages/flota/Conductores.jsx
import { useState } from 'react'
import { useConductores } from '../../hooks/useFlota'
import api from '../../lib/api'

// ——— Modal acceso conductor ————————————————————————————
function ModalAcceso({ conductor, onClose, onDone }) {
  const [form,    setForm]    = useState({ email: '', password: '' })
  const [saving,  setSaving]  = useState(false)
  const [err,     setErr]     = useState('')

  async function handleCrear(e) {
    e.preventDefault()
    if (!form.email || !form.password) return setErr('Email y contraseña son obligatorios')
    if (form.password.length < 6)       return setErr('La contraseña debe tener al menos 6 caracteres')
    setSaving(true); setErr('')
    try {
      await api.post(`/flota/conductores/${conductor.id}/acceso`, form)
      onDone()
    } catch (error) {
      setErr(error.response?.data?.error || 'Error al crear acceso')
    } finally {
      setSaving(false)
    }
  }

  async function handleEliminar() {
    if (!window.confirm(`¿Eliminar acceso de ${conductor.nombre}? Perderá el acceso al portal.`)) return
    setSaving(true)
    try {
      await api.delete(`/flota/conductores/${conductor.id}/acceso`)
      onDone()
    } catch (error) {
      setErr(error.response?.data?.error || 'Error al eliminar acceso')
    } finally {
      setSaving(false)
    }
  }

  const tieneAcceso = !!conductor.usuario

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="bg-[#22252e] border border-[#2d3039] rounded-2xl w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d3039]">
          <div>
            <div className="text-sm font-semibold text-white">Acceso al portal</div>
            <div className="text-xs text-zinc-400">{conductor.nombre}</div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-5">
          {err && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-sm text-red-400 mb-4">
              {err}
            </div>
          )}

          {tieneAcceso ? (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                <div className="text-xs text-emerald-400 font-semibold mb-0.5">Acceso activo</div>
                <div className="text-sm text-white font-mono">{conductor.usuario.email}</div>
              </div>
              <p className="text-xs text-zinc-400">
                Este conductor puede iniciar sesión en el portal con su email y contraseña.
              </p>
              <button
                onClick={handleEliminar}
                disabled={saving}
                className="w-full py-2.5 rounded-xl text-sm font-semibold border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                {saving ? 'Eliminando…' : 'Eliminar acceso'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleCrear} className="space-y-4">
              <p className="text-xs text-zinc-400">
                Crea credenciales de acceso para que {conductor.nombre.split(' ')[0]} pueda ingresar al portal conductor.
              </p>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email de acceso</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="conductor@ejemplo.cl"
                  className="w-full bg-[#1C1F26] border border-[#2d3039] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 placeholder-zinc-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Contraseña</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-[#1C1F26] border border-[#2d3039] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 placeholder-zinc-600"
                  minLength={6}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? 'Creando…' : 'Crear acceso'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ——— Página principal ————————————————————————————————
export default function FlotaConductores() {
  const { data, loading, error, refetch } = useConductores()
  const [form,         setForm]         = useState({ nombre: '', rut: '', telefono: '', email: '', licencia: '' })
  const [saving,       setSaving]       = useState(false)
  const [saveErr,      setSaveErr]      = useState('')
  const [showNew,      setShowNew]      = useState(false)
  const [modalAcceso,  setModalAcceso]  = useState(null) // conductor seleccionado

  const conductores = data?.data ?? data ?? []

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre.trim()) return setSaveErr('El nombre es obligatorio')
    setSaving(true); setSaveErr('')
    try {
      await api.post('/flota/conductores', form)
      setForm({ nombre: '', rut: '', telefono: '', email: '', licencia: '' })
      setShowNew(false)
      refetch()
    } catch (err) {
      setSaveErr(err.response?.data?.error || err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-7">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Conductores</h1>
        <button onClick={() => setShowNew(v => !v)} className="btn-primary">
          {showNew ? 'Cancelar' : '+ Nuevo conductor'}
        </button>
      </div>

      {/* Formulario nuevo conductor */}
      {showNew && (
        <form onSubmit={handleSubmit}
          className="bg-[#222] border border-[#363636] rounded-xl p-5 mb-6 grid grid-cols-2 gap-4">
          <div className="col-span-2 text-sm font-semibold text-zinc-300 mb-1">Datos del conductor</div>
          {[
            ['nombre',   'Nombre completo *', 'text',  'Juan Pérez'],
            ['rut',      'RUT',               'text',  '12.345.678-9'],
            ['telefono', 'Teléfono',          'tel',   '+56 9 1234 5678'],
            ['email',    'Email',             'email', 'juan@ejemplo.cl'],
            ['licencia', 'N° licencia',       'text',  'B1234567'],
          ].map(([key, label, type, placeholder]) => (
            <div key={key}>
              <label className="field-label block mb-1">{label}</label>
              <input type={type} placeholder={placeholder} value={form[key]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                className="input" />
            </div>
          ))}
          <div className="col-span-2 flex items-center gap-3">
            <span className="text-xs text-red-400">{saveErr}</span>
            <button type="submit" disabled={saving} className="btn-primary ml-auto disabled:opacity-50">
              {saving ? 'Guardando…' : 'Guardar conductor'}
            </button>
          </div>
        </form>
      )}

      {/* Lista */}
      {loading && <p className="text-zinc-500 text-sm">Cargando…</p>}
      {error   && <p className="text-red-400 text-sm">Error: {error}</p>}

      <div className="bg-[#222] border border-[#363636] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#363636] text-xs text-zinc-500 font-semibold uppercase tracking-wide">
              <th className="text-left px-5 py-3">Conductor</th>
              <th className="text-left px-4 py-3">RUT</th>
              <th className="text-left px-4 py-3">Teléfono</th>
              <th className="text-left px-4 py-3">Licencia</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-left px-4 py-3">Portal</th>
            </tr>
          </thead>
          <tbody>
            {!loading && conductores.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-zinc-500">Sin conductores registrados</td></tr>
            )}
            {conductores.map(c => (
              <tr key={c.id} className="border-b border-[#363636] last:border-0 hover:bg-[#2b2b2b] transition-colors">
                <td className="px-5 py-3">
                  <div className="font-semibold text-white">{c.nombre}</div>
                  {c.email && <div className="text-xs text-zinc-400">{c.email}</div>}
                </td>
                <td className="px-4 py-3 text-zinc-300 font-mono text-xs">{c.rut ?? '—'}</td>
                <td className="px-4 py-3 text-zinc-300">{c.telefono ?? '—'}</td>
                <td className="px-4 py-3 text-zinc-300 font-mono text-xs">{c.licenciaNumero ?? c.licencia ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold
                    ${c.activo
                      ? 'bg-green-400/10 text-green-400 border border-green-400/30'
                      : 'bg-zinc-700/50 text-zinc-500 border border-zinc-700'}`}>
                    {c.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setModalAcceso(c)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border
                      ${c.usuario
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
                        : 'border-[#2d3039] text-zinc-500 hover:text-white hover:border-zinc-600'}`}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      {c.usuario
                        ? <><circle cx="12" cy="12" r="3" /><path d="M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0z"/></>
                        : <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>
                      }
                    </svg>
                    {c.usuario ? 'Con acceso' : 'Sin acceso'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de acceso */}
      {modalAcceso && (
        <ModalAcceso
          conductor={modalAcceso}
          onClose={() => setModalAcceso(null)}
          onDone={() => { setModalAcceso(null); refetch() }}
        />
      )}
    </div>
  )
}
