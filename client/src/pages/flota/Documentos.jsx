// pages/flota/Documentos.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDocumentosFlota } from '../../hooks/useFlota'

const TIPO_LABELS = {
  REVISION_TECNICA:    'Revisión Técnica',
  PERMISO_CIRCULACION: 'Permiso de Circulación',
  SOAP:                'SOAP',
  SEGURO_VOLUNTARIO:   'Seguro Voluntario',
  OTRO:                'Otro',
}

const ESTADO_STYLES = {
  VENCIDO: { label: 'Vencido',    cls: 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]' },
  CRITICO: { label: '≤ 15 días',  cls: 'bg-[#FEF3C7] text-[#D97706] border-[#FCD34D]' },
  PROXIMO: { label: 'Próximo',    cls: 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE68A]' },
  VIGENTE: { label: 'Vigente',    cls: 'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]' },
}

const FILTROS_ESTADO = [
  { value: '',        label: 'Todos' },
  { value: 'VENCIDO', label: 'Vencidos' },
  { value: 'CRITICO', label: 'Críticos' },
  { value: 'PROXIMO', label: 'Próximos' },
  { value: 'VIGENTE', label: 'Vigentes' },
]

export default function FlotaDocumentos() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({ estado: '', tipo: '' })
  const { data, loading, error } = useDocumentosFlota(filters)
  const docs = data ?? []

  // Contadores para los chips resumen
  const counts = { VENCIDO: 0, CRITICO: 0, PROXIMO: 0, VIGENTE: 0 }
  docs.forEach(d => { if (counts[d.alerta] !== undefined) counts[d.alerta]++ })

  return (
    <div className="p-4 md:p-7">

      {/* Header */}
      <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#252A31]">Documentos legales</h1>
          <p className="text-sm text-[#737B86] mt-0.5">Vista global de toda la flota</p>
        </div>
      </div>

      {/* Chips resumen — solo cuando no hay filtro activo */}
      {!filters.estado && !filters.tipo && !loading && (
        <div className="flex gap-3 flex-wrap mb-5">
          {[
            { key: 'VENCIDO', label: 'Vencidos',  color: 'text-[#DC2626]' },
            { key: 'CRITICO', label: 'Críticos',  color: 'text-[#D97706]' },
            { key: 'PROXIMO', label: 'Próximos',  color: 'text-[#854D0E]' },
            { key: 'VIGENTE', label: 'Vigentes',  color: 'text-[#16A34A]' },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setFilters(f => ({ ...f, estado: key }))}
              className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-[#E1E4E8] rounded-xl hover:border-amber-400 transition-colors"
            >
              <span className="text-xs text-[#737B86]">{label}</span>
              <span className={`text-sm font-bold ${color}`}>{counts[key]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        {/* Filtro por estado */}
        <div className="flex gap-1 flex-wrap">
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
        </div>

        {/* Filtro por tipo */}
        <select
          value={filters.tipo}
          onChange={e => setFilters(prev => ({ ...prev, tipo: e.target.value }))}
          className="bg-white border border-[#E1E4E8] rounded-lg px-3 py-1.5 text-sm text-[#252A31] outline-none focus:border-amber-500 ml-auto"
        >
          <option value="">Todos los tipos</option>
          {Object.entries(TIPO_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      {loading && <p className="text-[#737B86] text-sm">Cargando…</p>}
      {error   && <p className="text-red-500 text-sm">Error: {error}</p>}

      {!loading && docs.length === 0 && (
        <div className="bg-white border border-[#E1E4E8] rounded-xl p-12 text-center">
          <div className="text-3xl mb-3">
            {filters.estado === 'VIGENTE' || (!filters.estado && !filters.tipo) ? '✓' : '🔍'}
          </div>
          <p className="text-[#737B86] text-sm">
            {filters.estado || filters.tipo
              ? 'No hay documentos con ese filtro'
              : 'No hay documentos registrados en la flota'}
          </p>
        </div>
      )}

      {!loading && docs.length > 0 && (
        <div className="bg-white border border-[#E1E4E8] rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-[#F4F5F6] border-b border-[#E5E7EB] text-xs text-[#737B86] font-semibold uppercase tracking-wide">
                <th className="text-left px-5 py-3">Vehículo</th>
                <th className="text-left px-4 py-3">Documento</th>
                <th className="text-left px-4 py-3">Vencimiento</th>
                <th className="text-left px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(doc => {
                const st = ESTADO_STYLES[doc.alerta] ?? ESTADO_STYLES.VIGENTE
                const fechaStr = doc.fechaVencimiento
                  ? new Date(doc.fechaVencimiento).toLocaleDateString('es-CL')
                  : '—'
                return (
                  <tr
                    key={doc.id}
                    className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F4F5F6] transition-colors cursor-pointer"
                    onClick={() => navigate(`/flota/vehiculos/${doc.vehiculo?.id}`)}
                    title="Ver ficha del vehículo"
                  >
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="font-semibold text-[#252A31] font-mono text-xs">{doc.vehiculo?.patente}</div>
                      <div className="text-xs text-[#737B86]">{doc.vehiculo?.marca} {doc.vehiculo?.modelo}</div>
                    </td>
                    <td className="px-4 py-3 text-[#252A31]">
                      {TIPO_LABELS[doc.tipo] ?? doc.tipo}
                    </td>
                    <td className="px-4 py-3 text-[#737B86] font-mono text-xs whitespace-nowrap">{fechaStr}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${st.cls}`}>
                        {doc.alerta === 'VENCIDO'
                          ? `Vencido hace ${Math.abs(doc.diasRestantes)}d`
                          : doc.alerta === 'VIGENTE'
                          ? `${doc.diasRestantes}d`
                          : `${doc.diasRestantes} días`}
                      </span>
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
