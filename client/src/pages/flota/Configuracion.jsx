// pages/flota/Configuracion.jsx
// Configuración del módulo de flota: datos de la organización y cambio de contraseña.
// Usa los endpoints existentes: GET/PUT /tenant y PATCH /auth/cambiar-password.

import { useState, useEffect } from 'react'
import api from '../../lib/api'

// ——— helpers ————————————————————————————————————————————
function Section({ title, icon, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
        <span className="text-amber-500">{icon}</span>
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  )
}

function Field({ label, children, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

function Input({ ...props }) {
  return (
    <input
      {...props}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 placeholder-gray-300 disabled:bg-gray-50 disabled:text-gray-400"
    />
  )
}

function SaveBtn({ loading, label = 'Guardar cambios' }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
    >
      {loading ? 'Guardando…' : label}
    </button>
  )
}

function Alert({ type, msg }) {
  if (!msg) return null
  const cls = type === 'ok'
    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
    : 'bg-red-50 border-red-200 text-red-700'
  return (
    <div className={`border rounded-lg px-3 py-2 text-sm ${cls}`}>{msg}</div>
  )
}

// ——— Sección Organización ————————————————————————————————
function SeccionOrganizacion() {
  const [form,    setForm]    = useState({ nombre: '', rut: '', direccion: '', email: '', telefono: '', logoUrl: '' })
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [ok,      setOk]      = useState('')
  const [err,     setErr]     = useState('')

  useEffect(() => {
    api.get('/tenant/me').then(r => {
      const { nombre, rut, direccion, email, telefono, logoUrl } = r.data
      setForm({ nombre: nombre || '', rut: rut || '', direccion: direccion || '', email: email || '', telefono: telefono || '', logoUrl: logoUrl || '' })
    }).catch(() => setErr('No se pudo cargar la información'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setOk(''); setErr('')
    if (!form.nombre.trim()) return setErr('El nombre es obligatorio')
    setSaving(true)
    try {
      await api.put('/tenant', form)
      setOk('Datos guardados correctamente')
    } catch (e) {
      setErr(e.response?.data?.error || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-sm text-gray-400 py-2">Cargando…</div>

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert type="ok"  msg={ok} />
      <Alert type="err" msg={err} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nombre de la organización">
          <Input
            value={form.nombre}
            onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
            placeholder="Ej: Empresa de Transportes S.A."
            required
          />
        </Field>
        <Field label="RUT" hint="Sin puntos, con guión">
          <Input
            value={form.rut}
            onChange={e => setForm(p => ({ ...p, rut: e.target.value }))}
            placeholder="Ej: 76.123.456-7"
          />
        </Field>
        <Field label="Correo electrónico">
          <Input
            type="email"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            placeholder="contacto@empresa.cl"
          />
        </Field>
        <Field label="Teléfono">
          <Input
            value={form.telefono}
            onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))}
            placeholder="+56 9 1234 5678"
          />
        </Field>
        <Field label="Dirección" >
          <Input
            value={form.direccion}
            onChange={e => setForm(p => ({ ...p, direccion: e.target.value }))}
            placeholder="Calle, número, ciudad"
          />
        </Field>
      </div>

      {/* Logo */}
      <div className="border-t border-gray-100 pt-4">
        <Field label="Logo de la empresa" hint="URL pública de imagen (JPG, PNG, SVG). Se mostrará en el panel y la barra lateral.">
          <div className="flex flex-wrap items-center gap-3">
            {/* Preview */}
            <div className="w-14 h-14 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
              {form.logoUrl ? (
                <img
                  src={form.logoUrl}
                  alt="Logo"
                  className="w-full h-full object-contain p-1"
                  onError={e => { e.target.style.display = 'none' }}
                />
              ) : (
                <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              )}
            </div>
            <Input
              value={form.logoUrl}
              onChange={e => setForm(p => ({ ...p, logoUrl: e.target.value }))}
              placeholder="https://empresa.cl/logo.png"
              className="flex-1 min-w-0"
            />
          </div>
        </Field>
      </div>

      <div className="flex justify-end pt-1">
        <SaveBtn loading={saving} />
      </div>
    </form>
  )
}

// ——— Sección Cambio de contraseña ————————————————————————
function SeccionCuenta() {
  const [form,   setForm]   = useState({ actual: '', nueva: '', confirmar: '' })
  const [saving, setSaving] = useState(false)
  const [ok,     setOk]     = useState('')
  const [err,    setErr]    = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setOk(''); setErr('')
    if (!form.actual || !form.nueva) return setErr('Completa todos los campos')
    if (form.nueva.length < 8) return setErr('La nueva contraseña debe tener al menos 8 caracteres')
    if (form.nueva !== form.confirmar) return setErr('Las contraseñas no coinciden')
    setSaving(true)
    try {
      await api.patch('/auth/cambiar-password', {
        passwordActual: form.actual,
        passwordNueva:  form.nueva,
      })
      setOk('Contraseña actualizada correctamente')
      setForm({ actual: '', nueva: '', confirmar: '' })
    } catch (e) {
      setErr(e.response?.data?.error || 'Error al cambiar la contraseña')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <Alert type="ok"  msg={ok} />
      <Alert type="err" msg={err} />

      <Field label="Contraseña actual">
        <Input
          type="password"
          value={form.actual}
          onChange={e => setForm(p => ({ ...p, actual: e.target.value }))}
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </Field>
      <Field label="Nueva contraseña" hint="Mínimo 8 caracteres">
        <Input
          type="password"
          value={form.nueva}
          onChange={e => setForm(p => ({ ...p, nueva: e.target.value }))}
          placeholder="••••••••"
          autoComplete="new-password"
        />
      </Field>
      <Field label="Confirmar nueva contraseña">
        <Input
          type="password"
          value={form.confirmar}
          onChange={e => setForm(p => ({ ...p, confirmar: e.target.value }))}
          placeholder="••••••••"
          autoComplete="new-password"
        />
      </Field>

      <div className="flex justify-end pt-1">
        <SaveBtn loading={saving} label="Cambiar contraseña" />
      </div>
    </form>
  )
}

// ——— Componente principal ————————————————————————————————
export default function Configuracion() {
  return (
    <div className="p-4 md:p-7 space-y-5 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ajustes de la cuenta y la organización</p>
      </div>

      <Section
        title="Organización"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M3 21h18M3 7v14M21 7v14M6 7V3h12v4M9 21v-6h6v6" />
          </svg>
        }
      >
        <SeccionOrganizacion />
      </Section>

      <Section
        title="Cuenta"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        }
      >
        <SeccionCuenta />
      </Section>
    </div>
  )
}
