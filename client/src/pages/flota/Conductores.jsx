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
      <div className="bg-white border border-[#E1E4E8] rounded-2xl w-full max-w-sm shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E1E4E8]">
          <div>
            <div className="text-sm font-semibold text-[#252A31]">Acceso al portal</div>
            <div className="text-xs text-[#737B86]">{conductor.nombre}</div>
          </div>
          <button onClick={onClose} className="text-[#737B86] hover:text-[#252A31] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-5">
          {err && (
            <div className="bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg px-3 py-2 text-sm text-[#DC2626] mb-4">
              {err}
            </div>
          )}

          {tieneAcceso ? (
            <div className="space-y-4">
              <div className="bg-[#DCFCE7] border border-[#86EFAC] rounded-xl px-4 py-3">
                <div className="text-xs text-[#16A34A] font-semibold mb-0.5">Acceso activo</div>
                <div className="text-sm text-[#252A31] font-mono">{conductor.usuario.email}</div>
              </div>
              <p className="text-xs text-[#737B86]">
                Este conductor puede iniciar sesión en el portal con su email y contraseña.
              </p>
              <button
                onClick={handleEliminar}
                disabled={saving}
                className="w-full py-2.5 rounded-xl text-sm font-semibold border border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEE2E2] transition-colors disabled:opacity-50"
              >
                {saving ? 'Eliminando…' : 'Eliminar acceso'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleCrear} className="space-y-4">
              <p className="text-xs text-[#737B86]">
                Crea credenciales de acceso para que {conductor.nombre.split(' ')[0]} pueda ingresar al portal conductor.
              </p>
              <div>
                <label className="block text-xs font-medium text-[#737B86] mb-1.5">Email de acceso</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="conductor@ejemplo.cl"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#737B86] mb-1.5">Contraseña</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  className="input"
                  minLength={6}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-amber-500 hover:bg-[#D97706] text-black text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white border border-[#E1E4E8] rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E1E4E8] sticky top-0 bg-white z-10">
          <div>
            <div className="text-sm font-semibold text-[#252A31]">Editar conductor</div>
            <div className="text-xs text-[#737B86]">{conductor.nombre}</div>
          </div>
          <button onClick={onClose} className="text-[#737B86] hover:text-[#252A31] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          {err && (
            <div className="bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg px-3 py-2 text-sm text-[#DC2626]">
              {err}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-xs font-medium text-[#737B86] mb-1.5">Nombre completo *</label>
            <input
              required
              value={form.nombre}
              onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
              placeholder="Juan Pérez"
              className="input"
            />
          </div>

          {/* RUT */}
          <div>
            <label className="block text-xs font-medium text-[#737B86] mb-1.5">RUT</label>
            <input
              value={form.rut}
              onChange={e => setForm(p => ({ ...p, rut: e.target.value }))}
              placeholder="12.345.678-9"
              className="input"
            />
          </div>

          {/* Teléfono / Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#737B86] mb-1.5">Teléfono</label>
              <input
                type="tel"
                value={form.telefono}
                onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))}
                placeholder="+56 9 1234 5678"
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#737B86] mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="juan@ejemplo.cl"
                className="input"
              />
            </div>
          </div>

          {/* Licencia */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#737B86] mb-1.5">N° licencia</label>
              <input
                value={form.licenciaNumero}
                onChange={e => setForm(p => ({ ...p, licenciaNumero: e.target.value }))}
                placeholder="B1234567"
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#737B86] mb-1.5">Categoría</label>
              <input
                value={form.licenciaCategoria}
                onChange={e => setForm(p => ({ ...p, licenciaCategoria: e.target.value }))}
                placeholder="B, C, D…"
                className="input"
              />
            </div>
          </div>

          {/* Vencimiento licencia */}
          <div>
            <label className="block text-xs font-medium text-[#737B86] mb-1.5">Vencimiento licencia</label>
            <input
              type="date"
              value={form.licenciaVence}
              onChange={e => setForm(p => ({ ...p, licenciaVence: e.target.value }))}
              className="input"
            />
          </div>

          {/* Estado activo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, activo: !p.activo }))}
              className={`relative w-10 h-5 rounded-full transition-colors ${form.activo ? 'bg-amber-500' : 'bg-[#A0A6AE]'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.activo ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-sm text-[#252A31]">{form.activo ? 'Activo' : 'Inactivo'}</span>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-[#737B86] hover:text-[#252A31] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-amber-500 hover:bg-[#D97706] disabled:opacity-50 text-black font-semibold text-sm px-5 py-2 rounded-lg transition-colors"
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
  const [modalAcceso,       setModalAcceso]       = useState(null)
  const [modalEditar,       setModalEditar]       = useState(null)
  const [mostrarInactivos,  setMostrarInactivos]  = useState(false)
  const [toggling,          setToggling]          = useState(null) // id del que se está procesando

  const todosLosConductores = data?.data ?? data ?? []
  const conductores = mostrarInactivos
    ? todosLosConductores
    : todosLosConductores.filter(c => c.activo !== false)

  async function handleToggleActivo(c) {
    if (toggling) return
    const desactivar = c.activo !== false
    if (desactivar && !window.confirm(`¿Desactivar a ${c.nombre}? Perderá acceso al portal si lo tenía.`)) return
    setToggling(c.id)
    try {
      await api.put(`/flota/conductores/${c.id}`, { activo: !desactivar })
      // Si se desactiva y tenía acceso al portal, revocarlo también
      if (desactivar && c.usuario) {
        await api.delete(`/flota/conductores/${c.id}/acceso`).catch(() => {})
      }
      refetch()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al actualizar conductor')
    } finally {
      setToggling(null)
    }
  }

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
    <div className="p-4 md:p-7">
      <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#252A31]">Conductores</h1>
        <div className="flex gap-2 items-center flex-wrap">
          <button
            onClick={() => setMostrarInactivos(v => !v)}
            className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors whitespace-nowrap ${
              mostrarInactivos
                ? 'bg-[#252A31] text-white border-[#252A31]'
                : 'bg-white text-[#737B86] border-[#E1E4E8] hover:border-[#C6CAD0]'
            }`}
          >
            {mostrarInactivos ? 'Ocultar inactivos' : 'Ver inactivos'}
          </button>
          <button onClick={() => setShowNew(v => !v)} className="btn-primary whitespace-nowrap">
            {showNew ? 'Cancelar' : '+ Nuevo conductor'}
          </button>
        </div>
      </div>

      {/* Formulario nuevo conductor */}
      {showNew && (
        <form onSubmit={handleSubmit}
          className="bg-white border border-[#E1E4E8] rounded-xl p-5 mb-6 grid grid-cols-2 gap-4">
          <div className="col-span-2 text-sm font-semibold text-[#252A31] mb-1">Datos del conductor</div>
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
      {loading && <p className="text-[#737B86] text-sm">Cargando…</p>}
      {error   && <p className="text-[#DC2626] text-sm">Error: {error}</p>}

      <div className="bg-white border border-[#E1E4E8] rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-[#F4F5F6] border-b border-[#E5E7EB] text-xs text-[#737B86] font-semibold uppercase tracking-wide">
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
              <tr><td colSpan={8} className="text-center py-12 text-[#737B86]">Sin conductores registrados</td></tr>
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
                <tr key={c.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F4F5F6] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#252A31]">{c.nombre}</span>
                      {c.activo === false && (
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-[#F4F5F6] text-[#737B86] border border-[#E1E4E8]">Inactivo</span>
                      )}
                    </div>
                    {c.email && <div className="text-xs text-[#737B86]">{c.email}</div>}
                  </td>
                  <td className="px-4 py-3 text-[#252A31] font-mono text-xs whitespace-nowrap">{c.rut ?? '—'}</td>
                  <td className="px-4 py-3">
                    {waUrl ? (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-[#16A34A] hover:text-green-700 transition-colors"
                        title="Abrir en WhatsApp"
                      >
                        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.86L.057 23.571a.5.5 0 0 0 .613.614l5.775-1.513A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.95 0-3.78-.54-5.343-1.476l-.38-.23-3.976 1.042 1.058-3.878-.248-.395A9.954 9.954 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                        </svg>
                        {c.telefono}
                      </a>
                    ) : (
                      <span className="text-[#A0A6AE]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {(c.licenciaCategoria || c.licenciaNumero) ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          {c.licenciaCategoria && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-[#F4F5F6] border border-[#E1E4E8] text-[#252A31]">
                              {c.licenciaCategoria}
                            </span>
                          )}
                          <span className="text-xs text-[#737B86] font-mono">{c.licenciaNumero ?? ''}</span>
                        </div>
                        {vence && (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold w-fit
                            ${licAlerta === 'VENCIDA' ? 'bg-[#FEE2E2] text-[#DC2626]'
                            : licAlerta === 'PROXIMA' ? 'bg-[#FEF3C7] text-[#D97706]'
                            : 'bg-[#DCFCE7] text-[#16A34A]'}`}
                          >
                            {licAlerta === 'VENCIDA' ? 'VENCIDA'
                              : `Vence ${vence.toLocaleDateString('es-CL', { day:'2-digit', month:'2-digit', year:'2-digit' })}`}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[#A0A6AE]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.vehiculoAsignado ? (
                      <div>
                        <div className="text-sm font-mono text-[#252A31]">{c.vehiculoAsignado.patente}</div>
                        <div className="text-xs text-[#737B86]">{c.vehiculoAsignado.marca} {c.vehiculoAsignado.modelo}</div>
                      </div>
                    ) : (
                      <span className="text-[#A0A6AE] text-xs italic">Sin vehículo</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border
                      ${c.activo
                        ? 'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]'
                        : 'bg-[#F4F5F6] text-[#737B86] border-[#E1E4E8]'}`}>
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setModalAcceso(c)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border
                        ${c.usuario
                          ? 'bg-[#FFF4DE] border-[#FCD34D] text-[#D97706] hover:bg-amber-100'
                          : 'border-[#E1E4E8] text-[#737B86] hover:text-[#252A31] hover:border-[#A0A6AE]'}`}
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
                  {/* Botones editar + desactivar */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setModalEditar(c)}
                        title="Editar conductor"
                        className="p-1.5 rounded-lg text-[#737B86] hover:text-amber-500 hover:bg-[#FFF4DE] transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleToggleActivo(c)}
                        disabled={toggling === c.id}
                        title={c.activo === false ? 'Reactivar conductor' : 'Desactivar conductor'}
                        className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                          c.activo === false
                            ? 'text-[#16A34A] hover:bg-green-50'
                            : 'text-[#737B86] hover:text-red-500 hover:bg-red-50'
                        }`}
                      >
                        {c.activo === false ? (
                          // Icono check-circle (reactivar)
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>
                          </svg>
                        ) : (
                          // Icono ban (desactivar)
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/>
                          </svg>
                        )}
                      </button>
                    </div>
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
