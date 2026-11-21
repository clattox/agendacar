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
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E1E4E8] rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E1E4E8] flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
              <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-[#252A31] text-sm">Gastos Tag electrónico</h2>
            <p className="text-xs text-[#737B86] mt-0.5">Peajes cobrados por telepeaje pendientes de monto</p>
          </div>
          {pendientes > 0 && (
            <span className="text-xs font-bold bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D] px-2 py-0.5 rounded-full">
              {pendientes} sin monto
            </span>
          )}
          <button type="button" onClick={onClose} className="text-[#737B86] hover:text-[#252A31] p-1 ml-1 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filtro */}
        <div className="px-6 py-3 border-b border-[#E1E4E8] flex items-center gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => setFiltroPend(false)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all
              ${!filtroPend ? 'border-[#C6CAD0] bg-[#E5E7EB] text-[#252A31]' : 'border-[#E1E4E8] text-[#737B86] hover:border-[#C6CAD0]'}`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setFiltroPend(true)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all
              ${filtroPend ? 'border-[#FCD34D] bg-[#FEF3C7] text-[#D97706]' : 'border-[#E1E4E8] text-[#737B86] hover:border-[#C6CAD0]'}`}
          >
            Solo pendientes
          </button>
          <button type="button" onClick={cargar} className="ml-auto text-xs text-[#737B86] hover:text-[#252A31] flex items-center gap-1 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
        </div>

        {/* Lista */}
        <div className="overflow-y-auto flex-1">
          {loading && (
            <div className="flex items-center justify-center py-16 text-[#737B86] text-sm">
              Cargando…
            </div>
          )}
          {error && (
            <div className="text-red-500 text-sm text-center py-10">{error}</div>
          )}
          {!loading && !error && peajes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 text-center px-6">
              <div className="w-12 h-12 rounded-full bg-[#F4F5F6] border border-[#E1E4E8] flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-[#A0A6AE]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                  <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <p className="text-[#737B86] text-sm font-medium">Sin peajes tag</p>
              <p className="text-[#A0A6AE] text-xs mt-1">
                {filtroPend ? 'Todos los peajes tag tienen monto registrado' : 'No hay peajes con tag registrados aún'}
              </p>
            </div>
          )}
          {!loading && !error && peajes.length > 0 && (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F4F5F6]">
                  <th className="text-left text-[#737B86] font-semibold px-5 py-2.5">Fecha</th>
                  <th className="text-left text-[#737B86] font-semibold px-3 py-2.5">Vehículo</th>
                  <th className="text-left text-[#737B86] font-semibold px-3 py-2.5">Autopista</th>
                  <th className="text-left text-[#737B86] font-semibold px-3 py-2.5">Sentido</th>
                  <th className="text-right text-[#737B86] font-semibold px-5 py-2.5">Monto</th>
                </tr>
              </thead>
              <tbody>
                {peajes.map(p => (
                  <tr key={p.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F4F5F6] transition-colors">
                    <td className="px-5 py-3 text-[#252A31] whitespace-nowrap">{FECHA(p.fecha)}</td>
                    <td className="px-3 py-3">
                      <div className="text-[#252A31] font-mono font-semibold">{p.vehiculo.patente}</div>
                      <div className="text-[#737B86]">{p.vehiculo.marca} {p.vehiculo.modelo}</div>
                    </td>
                    <td className="px-3 py-3 text-[#737B86]">{p.autopista || <span className="text-[#A0A6AE]">—</span>}</td>
                    <td className="px-3 py-3">
                      <span className="text-[#737B86]">{
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
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[#737B86] text-xs">$</span>
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
                            className="text-xs text-[#737B86] hover:text-[#252A31] px-1 transition-colors"
                          >✕</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 justify-end">
                          {p.pendiente ? (
                            <span className="text-[#D97706] font-semibold">Sin monto</span>
                          ) : (
                            <span className="text-[#252A31] font-semibold">{FMT(p.monto)}</span>
                          )}
                          <button
                            type="button"
                            onClick={() => { setEditando(p.id); setMontoInput(p.monto > 0 ? String(p.monto) : ''); setSaveError('') }}
                            className="text-[#A0A6AE] hover:text-blue-600 transition-colors p-0.5"
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
            <div className="px-5 py-2 text-xs text-red-500">{saveError}</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E1E4E8] flex-shrink-0">
          <p className="text-xs text-[#A0A6AE]">
            Los montos ingresados aquí quedan registrados en el historial del vehículo y se incluyen en el reporte Excel.
          </p>
        </div>
      </div>
    </div>
  )
}
