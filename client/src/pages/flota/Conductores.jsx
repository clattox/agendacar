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

// ——— Modal editar conductor ————————————————————————————
function ModalEditar({ conductor, onClose, onDone }) {
  const [form, setForm] = useState({
    nombre:            conductor.nombre            || '',
    rut:               conductor.rut               || '',
    telefono:          conductor.telefono          || '',
    email:             conductor.email             || '',
    licenciaNumero:    conductor.licenciaNumero    || '',
    licenciaCategoria: conductor.licenciaCategoria || '',
    licenciaVence:     conductor.licenciaVence
      ? conductor.licenciaVence.substring(0, 10)
      : '',
    activo: conductor.activo !== false,
  })
  const [saving, setSaving] = useState(false)
  const [err,    setErr]    = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre.trim()) return setErr('El nombre es obligatorio')
    setSaving(true); setErr('')
    try {
      await api.put(`/flota/conductores/${conductor.id}`, {
        ...form,
        licenciaVence: form.licenciaVence || null,
      })
      onDone()
    } catch (error) {
      setErr(error.response?.data?.error || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const INPUT_CLS = 'w-full bg-[#1C1F26] border border-[#2d3039] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 placeholder-zinc-600'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="bg-[#22252e] border border-[#2d3039] rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d3039] sticky top-0 bg-[#22252e] z-10">
          <div>
            <div className="text-sm font-semibold text-white">Editar conductor</div>
            <div className="text-xs text-zinc-400">{conductor.nombre}</div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          {err && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-sm text-red-400">
              {err}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nombre completo *</label>
            <input
              required
              value={form.nombre}
              onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
              placeholder="Juan Pérez"
              className={INPUT_CLS}
            />
          </div>

          {/* RUT */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">RUT</label>
            <input
              value={form.rut}
              onChange={e => setForm(p => ({ ...p, rut: e.target.value }))}
              placeholder="12.345.678-9"
              className={INPUT_CLS}
            />
          </div>

          {/* Teléfono / Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Teléfono</label>
              <input
                type="tel"
                value={form.telefono}
                onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))}
                placeholder="+56 9 1234 5678"
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="juan@ejemplo.cl"
                className={INPUT_CLS}
              />
            </div>
          </div>

          {/* Licencia */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">N° licencia</label>
              <input
                value={form.licenciaNumero}
                onChange={e => setForm(p => ({ ...p, licenciaNumero: e.target.value }))}
                placeholder="B1234567"
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Categoría</label>
              <input
                value={form.licenciaCategoria}
                onChange={e => setForm(p => ({ ...p, licenciaCategoria: e.target.value }))}
                placeholder="B, C, D…"
                className={INPUT_CLS}
              />
            </div>
          </div>

          {/* Vencimiento licencia */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Vencimiento licencia</label>
            <input
              type="date"
              value={form.licenciaVence}
              onChange={e => setForm(p => ({ ...p, licenciaVence: e.target.value }))}
              className={INPUT_CLS}
            />
          </div>

          {/* Estado activo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, activo: !p.activo }))}
              className={`relative w-10 h-5 rounded-full transition-colors ${form.activo ? 'bg-amber-500' : 'bg-zinc-700'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.activo ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-sm text-zinc-300">{form.activo ? 'Activo' : 'Inactivo'}</span>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold text-sm px-5 py-2 rounded-lg transition-colors"
            >
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
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
  const [modalEditar,  setModalEditar]  = useState(null) // conductor a editar

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
              <th className="text-left px-4 py-3">Vehículo</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-left px-4 py-3">Portal</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {!loading && conductores.length === 0 && (
              <tr><td colSpan={8} className="text-center py-12 text-zinc-500">Sin conductores registrados</td></tr>
            )}
            {conductores.map(c => {
              // Vigencia licencia
              const hoy = new Date()
              const vence = c.licenciaVence ? new Date(c.licenciaVence) : null
              const diasVence = vence ? Math.ceil((vence - hoy) / 86400000) : null
              const licAlerta = diasVence !== null
                ? (diasVence < 0 ? 'VENCIDA' : diasVence <= 30 ? 'PROXIMA' : 'OK')
                : null

              // WhatsApp link
              const telWA = c.telefono
                ? c.telefono.replace(/\D/g, '')
                : null
              const waUrl = telWA ? `https://wa.me/${telWA.startsWith('56') ? telWA : '56' + telWA}` : null

              return (
                <tr key={c.id} className="border-b border-[#363636] last:border-0 hover:bg-[#2b2b2b] transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-white">{c.nombre}</div>
                    {c.email && <div className="text-xs text-zinc-400">{c.email}</div>}
                  </td>
                  <td className="px-4 py-3 text-zinc-300 font-mono text-xs">{c.rut ?? '—'}</td>
                  <td className="px-4 py-3">
                    {waUrl ? (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-green-400 hover:text-green-300 transition-colors"
                        title="Abrir en WhatsApp"
                      >
                        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.86L.057 23.571a.5.5 0 0 0 .613.614l5.775-1.513A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.95 0-3.78-.54-5.343-1.476l-.38-.23-3.976 1.042 1.058-3.878-.248-.395A9.954 9.954 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                        </svg>
                        {c.telefono}
                      </a>
                    ) : (
                      <span className="text-zinc-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {(c.licenciaCategoria || c.licenciaNumero) ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          {c.licenciaCategoria && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-zinc-700 text-zinc-200">
                              {c.licenciaCategoria}
                            </span>
                          )}
                          <span className="text-xs text-zinc-400 font-mono">{c.licenciaNumero ?? ''}</span>
                        </div>
                        {vence && (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold w-fit
                            ${licAlerta === 'VENCIDA' ? 'bg-red-500/20 text-red-400'
                            : licAlerta === 'PROXIMA' ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-zinc-700/50 text-zinc-400'}`}
                          >
                            {licAlerta === 'VENCIDA' ? 'VENCIDA'
                              : `Vence ${vence.toLocaleDateString('es-CL', { day:'2-digit', month:'2-digit', year:'2-digit' })}`}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.vehiculoAsignado ? (
                      <div>
                        <div className="text-sm font-mono text-zinc-200">{c.vehiculoAsignado.patente}</div>
                        <div className="text-xs text-zinc-500">{c.vehiculoAsignado.marca} {c.vehiculoAsignado.modelo}</div>
                      </div>
                    ) : (
                      <span className="text-zinc-600 text-xs italic">Sin vehículo</span>
                    )}
                  </td>
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
                  {/* Botón editar */}
                  <td className="px-3 py-3">
                    <button
                      onClick={() => setModalEditar(c)}
                      title="Editar conductor"
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              )
            })}
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

      {/* Modal de edición */}
      {modalEditar && (
        <ModalEditar
          conductor={modalEditar}
          onClose={() => setModalEditar(null)}
          onDone={() => { setModalEditar(null); refetch() }}
        />
      )}
    </div>
  )
}
