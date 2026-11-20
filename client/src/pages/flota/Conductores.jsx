// pages/flota/Conductores.jsx
import { useState } from 'react'
import { useConductores } from '../../hooks/useFlota'
import api from '../../lib/api'

export default function FlotaConductores() {
  const { data, loading, error, refetch } = useConductores()
  const [form,    setForm]    = useState({ nombre: '', rut: '', telefono: '', email: '', licencia: '' })
  const [saving,  setSaving]  = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [showNew, setShowNew] = useState(false)

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
            </tr>
          </thead>
          <tbody>
            {!loading && conductores.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12 text-zinc-500">Sin conductores registrados</td></tr>
            )}
            {conductores.map(c => (
              <tr key={c.id} className="border-b border-[#363636] last:border-0 hover:bg-[#2b2b2b] transition-colors">
                <td className="px-5 py-3">
                  <div className="font-semibold text-white">{c.nombre}</div>
                  {c.email && <div className="text-xs text-zinc-400">{c.email}</div>}
                </td>
                <td className="px-4 py-3 text-zinc-300 font-mono text-xs">{c.rut ?? '—'}</td>
                <td className="px-4 py-3 text-zinc-300">{c.telefono ?? '—'}</td>
                <td className="px-4 py-3 text-zinc-300 font-mono text-xs">{c.licencia ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold
                    ${c.activo
                      ? 'bg-green-400/10 text-green-400 border border-green-400/30'
                      : 'bg-zinc-700/50 text-zinc-500 border border-zinc-700'}`}>
                    {c.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
