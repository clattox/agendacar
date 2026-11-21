// components/flota/NuevoVehiculo.jsx
import { useState, useEffect } from 'react'
import { useCrearVehiculo } from '../../hooks/useFlota'
import api from '../../lib/api'

const CATEGORIAS = ['Camioneta', 'Furgón', 'Sedán', 'SUV', 'Camión', 'Van', 'Moto', 'Otro']

export default function NuevoVehiculo({ onClose, onSuccess }) {
  const { loading, execute } = useCrearVehiculo()
  const [form, setForm] = useState({
    marca: '', modelo: '', anio: '', patente: '',
    color: '', categoria: '', numeroInterno: '',
    region: '', unidadOperativa: '',
  })
  const [error,   setError]   = useState(null)
  const [catalogo, setCatalogo] = useState({}) // { marca: [modelo,...] }

  // Cargar catálogo al montar
  useEffect(() => {
    api.get('/flota/vehiculos/catalogo')
      .then(r => setCatalogo(r.data.catalogo || {}))
      .catch(() => {}) // silencioso — el catálogo es opcional
  }, [])

  function set(key, value) {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      // Si cambia la marca, limpiar modelo para evitar combinaciones inválidas
      if (key === 'marca') next.modelo = ''
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      await execute({
        ...form,
        anio:    Number(form.anio),
        patente: form.patente.toUpperCase(),
        color:           form.color           || undefined,
        categoria:       form.categoria       || undefined,
        numeroInterno:   form.numeroInterno   || undefined,
        region:          form.region          || undefined,
        unidadOperativa: form.unidadOperativa || undefined,
      })
      onSuccess()
    } catch (err) {
      setError(err.message)
    }
  }

  // Marcas y modelos disponibles en el catálogo
  const marcas   = Object.keys(catalogo).sort()
  const modelos  = form.marca && catalogo[form.marca] ? catalogo[form.marca] : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white border border-[#E1E4E8] rounded-2xl w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E1E4E8]">
          <h2 className="text-base font-bold text-[#252A31]">Nuevo vehículo</h2>
          <button
            onClick={onClose}
            className="text-[#737B86] hover:text-[#252A31] transition-colors text-xl leading-none"
          >×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Fila marca / modelo */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Marca *">
              <input
                required
                list="catalogo-marcas"
                value={form.marca}
                onChange={e => set('marca', e.target.value)}
                placeholder="Toyota"
                className={INPUT}
              />
              {marcas.length > 0 && (
                <datalist id="catalogo-marcas">
                  {marcas.map(m => <option key={m} value={m} />)}
                </datalist>
              )}
            </Field>
            <Field label="Modelo *">
              <input
                required
                list="catalogo-modelos"
                value={form.modelo}
                onChange={e => set('modelo', e.target.value)}
                placeholder="Hilux"
                className={INPUT}
              />
              {modelos.length > 0 && (
                <datalist id="catalogo-modelos">
                  {modelos.map(m => <option key={m} value={m} />)}
                </datalist>
              )}
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

          {/* Fila región / unidad operativa */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Región">
              <input
                value={form.region}
                onChange={e => set('region', e.target.value)}
                placeholder="Biobío"
                className={INPUT}
              />
            </Field>
            <Field label="Unidad operativa">
              <input
                value={form.unidadOperativa}
                onChange={e => set('unidadOperativa', e.target.value)}
                placeholder="Flota norte"
                className={INPUT}
              />
            </Field>
          </div>

          {error && (
            <p className="text-[#DC2626] text-sm bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg px-3 py-2">
              {error}
            </p>
          )}

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
      <label className="text-xs font-semibold text-[#737B86] uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

const INPUT = 'bg-white border border-[#E1E4E8] rounded-lg px-3 py-2 text-sm text-[#252A31] placeholder-[#A0A6AE] outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 w-full transition-colors'
