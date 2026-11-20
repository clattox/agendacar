// components/flota/NuevoVehiculo.jsx
import { useState } from 'react'
import { useCrearVehiculo } from '../../hooks/useFlota'

const CATEGORIAS = ['Camioneta', 'Furgón', 'Sedán', 'SUV', 'Camión', 'Van', 'Moto', 'Otro']

export default function NuevoVehiculo({ onClose, onSuccess }) {
  const { loading, execute } = useCrearVehiculo()
  const [form, setForm] = useState({
    marca: '', modelo: '', anio: '', patente: '',
    color: '', categoria: '', numeroInterno: '',
  })
  const [error, setError] = useState(null)

  function set(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      await execute({
        ...form,
        anio:    Number(form.anio),
        patente: form.patente.toUpperCase(),
        color:          form.color         || undefined,
        categoria:      form.categoria     || undefined,
        numeroInterno:  form.numeroInterno || undefined,
      })
      onSuccess()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[#1e2029] border border-[#2d3039] rounded-2xl w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d3039]">
          <h2 className="text-base font-bold text-white">Nuevo vehículo</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors text-xl leading-none"
          >×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Fila marca / modelo */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Marca *">
              <input
                required
                value={form.marca}
                onChange={e => set('marca', e.target.value)}
                placeholder="Toyota"
                className={INPUT}
              />
            </Field>
            <Field label="Modelo *">
              <input
                required
                value={form.modelo}
                onChange={e => set('modelo', e.target.value)}
                placeholder="Hilux"
                className={INPUT}
              />
            </Field>
          </div>

          {/* Fila año / patente */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Año *">
              <input
                required
                type="number"
                min="1990"
                max={new Date().getFullYear() + 1}
                value={form.anio}
                onChange={e => set('anio', e.target.value)}
                placeholder="2022"
                className={INPUT}
              />
            </Field>
            <Field label="Patente *">
              <input
                required
                value={form.patente}
                onChange={e => set('patente', e.target.value.toUpperCase())}
                placeholder="ABCD12"
                maxLength={8}
                className={`${INPUT} font-mono tracking-widest`}
              />
            </Field>
          </div>

          {/* Categoría */}
          <Field label="Categoría">
            <select
              value={form.categoria}
              onChange={e => set('categoria', e.target.value)}
              className={INPUT}
            >
              <option value="">Sin categoría</option>
              {CATEGORIAS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          {/* Fila color / número interno */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Color">
              <input
                value={form.color}
                onChange={e => set('color', e.target.value)}
                placeholder="Blanco"
                className={INPUT}
              />
            </Field>
            <Field label="N° interno">
              <input
                value={form.numeroInterno}
                onChange={e => set('numeroInterno', e.target.value)}
                placeholder="V-01"
                className={INPUT}
              />
            </Field>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

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
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold text-sm px-5 py-2 rounded-lg transition-colors"
            >
              {loading ? 'Guardando…' : 'Agregar vehículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

const INPUT = 'bg-[#111317] border border-[#363636] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-amber-500 w-full transition-colors'
