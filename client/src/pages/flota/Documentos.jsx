// pages/flota/Documentos.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDocumentosFlota } from '../../hooks/useFlota'
import { getToken } from '../../lib/auth'

const API = import.meta.env.VITE_API_URL
const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` })

const TIPO_LABELS = {
  REVISION_TECNICA:    'Revisión Técnica',
  PERMISO_CIRCULACION: 'Permiso de Circulación',
  SOAP:                'SOAP',
  SEGURO_VOLUNTARIO:   'Seguro Voluntario',
  OTRO:                'Otro',
}

// Orden de prioridad para ordenar filas
const ALERTA_ORDEN = { VENCIDO: 0, CRITICO: 1, PROXIMO: 2, VIGENTE: 3 }

const ESTADO_CFG = {
  VENCIDO: {
    badge:    'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]',
    icon:     '✕',
    iconCls:  'text-[#DC2626]',
  },
  CRITICO: {
    badge:    'bg-[#FEF3C7] text-[#D97706] border-[#FCD34D]',
    icon:     '⚠',
    iconCls:  'text-[#D97706]',
  },
  PROXIMO: {
    badge:    'bg-[#FEF9C3] text-[#854D0E] border-[#FDE68A]',
    icon:     '◷',
    iconCls:  'text-[#854D0E]',
  },
  VIGENTE: {
    badge:    'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]',
    icon:     '✓',
    iconCls:  'text-[#16A34A]',
  },
}

const FILTROS_ESTADO = [
  { value: '',        label: 'Todos' },
  { value: 'VENCIDO', label: 'Vencidos' },
  { value: 'CRITICO', label: 'Críticos' },
  { value: 'PROXIMO', label: 'Próximos' },
  { value: 'VIGENTE', label: 'Vigentes' },
]

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function formatFecha(fechaStr) {
  if (!fechaStr) return { principal: '—', sub: '' }
  const d = new Date(fechaStr)
  const principal = d.toLocaleDateString('es-CL')
  const sub = DIAS_SEMANA[d.getDay()]
  return { principal, sub }
}

function badgeLabel(alerta, diasRestantes) {
  if (alerta === 'VENCIDO') return `Vencido hace ${Math.abs(diasRestantes)}d`
  if (alerta === 'VIGENTE') return `Vigente · ${diasRestantes}d`
  return `${diasRestantes} días`
}

// ── Hook configuración alertas ────────────────────────────────────────────────
function useAlertaConfig() {
  const [cfg, setCfg]       = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  useEffect(() => {
    fetch(`${API}/api/flota/documentos/configuracion`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => setCfg({ alertaDocActiva: data.alertaDocActiva ?? false, alertaDocDias: data.alertaDocDias ?? '20,10,5' }))
      .catch(() => {})
  }, [])

  const guardar = async () => {
    if (!cfg) return
    setSaving(true)
    try {
      const r = await fetch(`${API}/api/flota/documentos/configuracion`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg)
      })
      if (r.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
    } finally { setSaving(false) }
  }

  return { cfg, setCfg, saving, saved, guardar }
}

export default function FlotaDocumentos() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({ estado: '', tipo: '' })
  const { data, loading, error } = useDocumentosFlota(filters)
  const { cfg, setCfg, saving, saved, guardar } = useAlertaConfig()
  const [showConfig, setShowConfig] = useState(false)

  // Ordenar: vencidos → críticos → próximos → vigentes, luego por fecha asc
  const docs = (data ?? []).slice().sort((a, b) => {
    const pa = ALERTA_ORDEN[a.alerta] ?? 9
    const pb = ALERTA_ORDEN[b.alerta] ?? 9
    if (pa !== pb) return pa - pb
    return new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento)
  })

  // Contadores siempre sobre data cruda (sin filtro aplicado en UI)
  const counts = { VENCIDO: 0, CRITICO: 0, PROXIMO: 0, VIGENTE: 0 }
  docs.forEach(d => { if (counts[d.alerta] !== undefined) counts[d.alerta]++ })

  function abrirPDF(e, doc) {
    e.stopPropagation()
    if (!doc.archivoBase64) return
    const b64 = doc.archivoBase64.startsWith('data:')
      ? doc.archivoBase64.split(',')[1]
      : doc.archivoBase64
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
    const blob  = new Blob([bytes], { type: 'application/pdf' })
    const url   = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }

  return (
    <div className="p-4 md:p-7">

      {/* Header */}
      <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#252A31]">Documentos legales</h1>
          <p className="text-sm text-[#737B86] mt-0.5">Vista global de toda la flota</p>
        </div>
        <button
          onClick={() => setShowConfig(v => !v)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap ${
            showConfig
              ? 'bg-[#252A31] text-white border-[#252A31]'
              : 'bg-white text-[#737B86] border-[#E1E4E8] hover:border-[#C6CAD0]'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Alertas
        </button>
      </div>

      {/* Panel configuración alertas */}
      {showConfig && cfg && (
        <div className="bg-white border border-[#E1E4E8] rounded-xl p-5 mb-5">
          <h3 className="text-sm font-semibold text-[#252A31] mb-4">Alertas por correo — documentos de flota</h3>

          {/* Toggle activo */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setCfg(c => ({ ...c, alertaDocActiva: !c.alertaDocActiva }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                cfg.alertaDocActiva ? 'bg-amber-500' : 'bg-[#D1D5DB]'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                cfg.alertaDocActiva ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
            <span className="text-sm text-[#374151]">
              {cfg.alertaDocActiva ? 'Alertas activas' : 'Alertas desactivadas'}
            </span>
          </div>

          {/* Días */}
          {cfg.alertaDocActiva && (
            <div className="mb-4">
              <label className="block text-xs text-[#737B86] mb-1.5">
                Enviar alerta cuando falten (días antes del vencimiento)
              </label>
              <input
                type="text"
                value={cfg.alertaDocDias}
                onChange={e => setCfg(c => ({ ...c, alertaDocDias: e.target.value }))}
                placeholder="20,10,5"
                className="border border-[#E1E4E8] rounded-lg px-3 py-2 text-sm text-[#252A31] outline-none focus:border-amber-500 w-48"
              />
              <p className="text-xs text-[#737B86] mt-1">Separados por coma — ej: <span className="font-mono">20,10,5</span></p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={guardar}
              disabled={saving}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            {saved && <span className="text-sm text-green-600 font-medium">✓ Guardado</span>}
          </div>

          <p className="text-xs text-[#9CA3AF] mt-3">
            Los correos se envían al email del administrador cuando un documento está a N días de vencer.
            Se evitan duplicados: cada alerta se envía una sola vez por documento y umbral.
          </p>
        </div>
      )}

      {/* Chips resumen */}
      {!loading && (
        <div className="flex gap-3 flex-wrap mb-5">
          {[
            { key: 'VENCIDO', label: 'Vencidos',  color: 'text-[#DC2626]', border: 'hover:border-red-300' },
            { key: 'CRITICO', label: 'Críticos',  color: 'text-[#D97706]', border: 'hover:border-amber-300' },
            { key: 'PROXIMO', label: 'Próximos',  color: 'text-[#854D0E]', border: 'hover:border-yellow-300' },
            { key: 'VIGENTE', label: 'Vigentes',  color: 'text-[#16A34A]', border: 'hover:border-green-300' },
          ].map(({ key, label, color, border }) => (
            <button
              key={key}
              onClick={() => setFilters(f => ({ ...f, estado: filters.estado === key ? '' : key }))}
              className={`flex items-center gap-2.5 px-4 py-2.5 bg-white border rounded-xl transition-colors ${
                filters.estado === key
                  ? 'border-[#252A31] shadow-sm'
                  : `border-[#E1E4E8] ${border}`
              }`}
            >
              <span className="text-xs text-[#737B86]">{label}</span>
              <span className={`text-sm font-bold ${color}`}>{counts[key]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Filtros — estado + tipo en la misma línea */}
      <div className="flex flex-wrap gap-2 mb-5 items-center">
        {FILTROS_ESTADO.map(f => (
          <button
            key={f.value}
            onClick={() => setFilters(prev => ({ ...prev, estado: f.value }))}
            className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors whitespace-nowrap ${
              filters.estado === f.value
                ? 'bg-[#252A31] text-white border-[#252A31]'
                : 'bg-white text-[#737B86] border-[#E1E4E8] hover:border-[#C6CAD0]'
            }`}
          >
            {f.label}
          </button>
        ))}

        <select
          value={filters.tipo}
          onChange={e => setFilters(prev => ({ ...prev, tipo: e.target.value }))}
          className="bg-white border border-[#E1E4E8] rounded-lg px-3 py-1.5 text-sm text-[#252A31] outline-none focus:border-amber-500"
        >
          <option value="">Todos los tipos</option>
          {Object.entries(TIPO_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {/* Estados de carga / vacío */}
      {loading && <p className="text-[#737B86] text-sm">Cargando…</p>}
      {error   && <p className="text-red-500 text-sm">Error: {error}</p>}

      {!loading && docs.length === 0 && (
        <div className="bg-white border border-[#E1E4E8] rounded-xl p-12 text-center">
          <p className="text-[#737B86] text-sm">
            {filters.estado || filters.tipo
              ? 'No hay documentos con ese filtro'
              : 'No hay documentos registrados en la flota'}
          </p>
        </div>
      )}

      {/* Tabla */}
      {!loading && docs.length > 0 && (
        <div className="bg-white border border-[#E1E4E8] rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[620px]">
            <thead>
              <tr className="bg-[#F4F5F6] border-b border-[#E5E7EB] text-xs text-[#737B86] font-semibold uppercase tracking-wide">
                <th className="text-left px-5 py-3">Vehículo</th>
                <th className="text-left px-4 py-3">Documento</th>
                <th className="text-left px-4 py-3">Vencimiento</th>
                <th className="text-left px-4 py-3">Vigencia</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {docs.map(doc => {
                const cfg = ESTADO_CFG[doc.alerta] ?? ESTADO_CFG.VIGENTE
                const { principal: fechaPrincipal, sub: fechaSub } = formatFecha(doc.fechaVencimiento)
                return (
                  <tr
                    key={doc.id}
                    className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F4F5F6] transition-colors cursor-pointer"
                    onClick={() => navigate(`/flota/vehiculos/${doc.vehiculo?.id}`)}
                    title="Ver ficha del vehículo"
                  >
                    {/* Vehículo */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="font-semibold text-[#252A31] font-mono text-xs">{doc.vehiculo?.patente}</div>
                      <div className="text-xs text-[#737B86]">{doc.vehiculo?.marca} {doc.vehiculo?.modelo}</div>
                    </td>

                    {/* Documento */}
                    <td className="px-4 py-3 text-[#252A31] whitespace-nowrap">
                      {TIPO_LABELS[doc.tipo] ?? doc.tipo}
                    </td>

                    {/* Vencimiento con día de semana */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-mono text-xs text-[#252A31]">{fechaPrincipal}</div>
                      {fechaSub && <div className="text-xs text-[#737B86]">{fechaSub}</div>}
                    </td>

                    {/* Badge de vigencia */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.badge}`}>
                        <span>{cfg.icon}</span>
                        {badgeLabel(doc.alerta, doc.diasRestantes)}
                      </span>
                    </td>

                    {/* Acción: ver PDF */}
                    <td className="px-4 py-3 text-center">
                      {doc.archivoBase64 ? (
                        <button
                          onClick={e => abrirPDF(e, doc)}
                          title="Ver PDF"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#F4F5F6] hover:bg-amber-100 hover:text-amber-700 text-[#737B86] transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      ) : (
                        <span className="text-[#C6CAD0] text-xs">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="px-5 py-3 border-t border-[#E5E7EB] text-xs text-[#737B86]">
            {docs.length} documento{docs.length !== 1 ? 's' : ''}
            {filters.estado || filters.tipo ? ' con filtro activo' : ' en total'}
          </div>
        </div>
      )}
    </div>
  )
}
