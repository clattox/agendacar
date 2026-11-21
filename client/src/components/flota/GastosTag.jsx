// components/flota/GastosTag.jsx
// Modal admin: lista y actualiza montos de peajes cobrados con tag electrónico.

import { useState, useEffect, useCallback } from 'react'
import api from '../../lib/api'

const FMT = n => n ? `$${Number(n).toLocaleString('es-CL')}` : '—'
const FECHA = iso => {
  const d = new Date(iso)
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function GastosTag({ onClose }) {
  const [peajes,       setPeajes]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [filtroPend,   setFiltroPend]   = useState(false)
  const [editando,     setEditando]     = useState(null)   // id del peaje en edición
  const [montoInput,   setMontoInput]   = useState('')
  const [savingId,     setSavingId]     = useState(null)
  const [saveError,    setSaveError]    = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const qs = filtroPend ? '?pendientes=1' : ''
      const res = await api.get(`/flota/reportes/peajes-tag${qs}`)
      setPeajes(res.data)
    } catch {
      setError('No se pudo cargar la lista de peajes tag')
    } finally {
      setLoading(false)
    }
  }, [filtroPend])

  useEffect(() => { cargar() }, [cargar])

  async function guardarMonto(id) {
    setSaveError('')
    const m = Number(montoInput)
    if (!m || m <= 0) return setSaveError('Ingresa un monto válido')
    setSavingId(id)
    try {
      await api.put(`/flota/reportes/peajes-tag/${id}/monto`, { monto: m })
      setEditando(null)
      setMontoInput('')
      await cargar()
    } catch {
      setSaveError('Error al guardar. Intenta de nuevo.')
    } finally {
      setSavingId(null)
    }
  }

  const pendientes = peajes.filter(p => p.pendiente).length

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-[#1e1e1e] border border-[#363636] rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#363636] flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
              <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-white text-sm">Gastos Tag electrónico</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Peajes cobrados por telepeaje pendientes de monto</p>
          </div>
          {pendientes > 0 && (
            <span className="text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
              {pendientes} sin monto
            </span>
          )}
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white p-1 ml-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filtro */}
        <div className="px-6 py-3 border-b border-[#2a2a2a] flex items-center gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => setFiltroPend(false)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all
              ${!filtroPend ? 'border-zinc-500 bg-zinc-700 text-white' : 'border-[#363636] text-zinc-500 hover:text-zinc-300'}`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setFiltroPend(true)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all
              ${filtroPend ? 'border-amber-500/40 bg-amber-500/10 text-amber-400' : 'border-[#363636] text-zinc-500 hover:text-zinc-300'}`}
          >
            Solo pendientes
          </button>
          <button type="button" onClick={cargar} className="ml-auto text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
        </div>

        {/* Lista */}
        <div className="overflow-y-auto flex-1">
          {loading && (
            <div className="flex items-center justify-center py-16 text-zinc-500 text-sm">
              Cargando…
            </div>
          )}
          {error && (
            <div className="text-red-400 text-sm text-center py-10">{error}</div>
          )}
          {!loading && !error && peajes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 text-center px-6">
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                  <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <p className="text-zinc-400 text-sm font-medium">Sin peajes tag</p>
              <p className="text-zinc-600 text-xs mt-1">
                {filtroPend ? 'Todos los peajes tag tienen monto registrado' : 'No hay peajes con tag registrados aún'}
              </p>
            </div>
          )}
          {!loading && !error && peajes.length > 0 && (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#2a2a2a]">
                  <th className="text-left text-zinc-500 font-semibold px-5 py-2.5">Fecha</th>
                  <th className="text-left text-zinc-500 font-semibold px-3 py-2.5">Vehículo</th>
                  <th className="text-left text-zinc-500 font-semibold px-3 py-2.5">Autopista</th>
                  <th className="text-left text-zinc-500 font-semibold px-3 py-2.5">Sentido</th>
                  <th className="text-right text-zinc-500 font-semibold px-5 py-2.5">Monto</th>
                </tr>
              </thead>
              <tbody>
                {peajes.map(p => (
                  <tr key={p.id} className="border-b border-[#242424] hover:bg-[#242424] transition-colors">
                    <td className="px-5 py-3 text-zinc-300 whitespace-nowrap">{FECHA(p.fecha)}</td>
                    <td className="px-3 py-3">
                      <div className="text-zinc-200 font-mono font-semibold">{p.vehiculo.patente}</div>
                      <div className="text-zinc-500">{p.vehiculo.marca} {p.vehiculo.modelo}</div>
                    </td>
                    <td className="px-3 py-3 text-zinc-400">{p.autopista || <span className="text-zinc-700">—</span>}</td>
                    <td className="px-3 py-3">
                      <span className="text-zinc-500">{
                        p.sentido === 'IDA' ? 'Ida' : p.sentido === 'VUELTA' ? 'Vuelta' : 'Ida y vuelta'
                      }</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {editando === p.id ? (
                        <div className="flex items-center gap-1.5 justify-end">
                          <div className="relative">
                            <input
                              autoFocus
                              type="number"
                              value={montoInput}
                              onChange={e => { setMontoInput(e.target.value); setSaveError('') }}
                              onKeyDown={e => { if (e.key === 'Enter') guardarMonto(p.id); if (e.key === 'Escape') { setEditando(null); setSaveError('') } }}
                              className="input text-xs text-right w-28 py-1.5 pr-5"
                              placeholder="16000"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">$</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => guardarMonto(p.id)}
                            disabled={savingId === p.id}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
                          >
                            {savingId === p.id ? '…' : 'OK'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditando(null); setSaveError('') }}
                            className="text-xs text-zinc-500 hover:text-zinc-300 px-1"
                          >✕</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 justify-end">
                          {p.pendiente ? (
                            <span className="text-amber-400 font-semibold">Sin monto</span>
                          ) : (
                            <span className="text-zinc-200 font-semibold">{FMT(p.monto)}</span>
                          )}
                          <button
                            type="button"
                            onClick={() => { setEditando(p.id); setMontoInput(p.monto > 0 ? String(p.monto) : ''); setSaveError('') }}
                            className="text-zinc-600 hover:text-blue-400 transition-colors p-0.5"
                            title={p.pendiente ? 'Ingresar monto' : 'Editar monto'}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {saveError && (
            <div className="px-5 py-2 text-xs text-red-400">{saveError}</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#363636] flex-shrink-0">
          <p className="text-xs text-zinc-600">
            Los montos ingresados aquí quedan registrados en el historial del vehículo y se incluyen en el reporte Excel.
          </p>
        </div>
      </div>
    </div>
  )
}
