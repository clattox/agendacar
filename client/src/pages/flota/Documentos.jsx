// pages/flota/Documentos.jsx
import { useVencimientos } from '../../hooks/useFlota'

const TIPO_LABELS = {
  REVISION_TECNICA:   'Revisión Técnica',
  PERMISO_CIRCULACION:'Permiso de Circulación',
  SOAP:               'SOAP',
  SEGURO_VOLUNTARIO:  'Seguro Voluntario',
  OTRO:               'Otro documento',
}

const ALERTA_STYLES = {
  VENCIDO: { label: 'Vencido',   cls: 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]' },
  CRITICO: { label: '≤ 15 días', cls: 'bg-[#FEF3C7] text-[#D97706] border-[#FCD34D]' },
  PROXIMO: { label: 'Próximo',   cls: 'bg-[#F4F5F6] text-[#737B86] border-[#E1E4E8]' },
}

export default function FlotaDocumentos() {
  const { data: docs60, loading, error } = useVencimientos(60)
  const docs = docs60 ?? []

  const vencidos = docs.filter(d => d.alerta === 'VENCIDO')
  const criticos = docs.filter(d => d.alerta === 'CRITICO')
  const proximos  = docs.filter(d => d.alerta === 'PROXIMO')

  return (
    <div className="p-4 md:p-7">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#252A31]">Documentos legales</h1>
        <p className="text-sm text-[#737B86] mt-1">Vencimientos en los próximos 60 días</p>
      </div>

      {loading && <p className="text-[#737B86] text-sm">Cargando…</p>}
      {error   && <p className="text-red-500 text-sm">Error: {error}</p>}

      {!loading && docs.length === 0 && (
        <div className="bg-white border border-[#E1E4E8] rounded-xl p-10 text-center">
          <div className="text-[#16A34A] text-2xl mb-2">✓</div>
          <p className="text-[#737B86] text-sm">Todos los documentos están vigentes por más de 60 días</p>
        </div>
      )}

      {[
        { grupo: vencidos, titulo: 'Documentos vencidos',   nivel: 'VENCIDO' },
        { grupo: criticos, titulo: 'Críticos (≤ 15 días)',  nivel: 'CRITICO' },
        { grupo: proximos,  titulo: 'Próximos a vencer',     nivel: 'PROXIMO' },
      ].map(({ grupo, titulo, nivel }) => grupo.length > 0 && (
        <div key={nivel} className="mb-6">
          <h2 className="text-xs font-bold text-[#737B86] uppercase tracking-widest mb-3">{titulo}</h2>
          <div className="bg-white border border-[#E1E4E8] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F4F5F6] border-b border-[#E5E7EB] text-xs text-[#737B86] font-semibold uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Vehículo</th>
                  <th className="text-left px-4 py-3">Documento</th>
                  <th className="text-left px-4 py-3">Vencimiento</th>
                  <th className="text-left px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {grupo.map(doc => {
                  const st = ALERTA_STYLES[doc.alerta]
                  const fechaStr = doc.fechaVencimiento
                    ? new Date(doc.fechaVencimiento).toLocaleDateString('es-CL')
                    : '—'
                  return (
                    <tr key={doc.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F4F5F6] transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-[#252A31] font-mono text-xs">{doc.vehiculo?.patente}</div>
                        <div className="text-xs text-[#737B86]">{doc.vehiculo?.marca} {doc.vehiculo?.modelo}</div>
                      </td>
                      <td className="px-4 py-3 text-[#252A31]">
                        {TIPO_LABELS[doc.tipo] ?? doc.tipo}
                      </td>
                      <td className="px-4 py-3 text-[#737B86] font-mono text-xs">{fechaStr}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${st.cls}`}>
                          {doc.alerta === 'VENCIDO'
                            ? 'Vencido'
                            : `${doc.diasRestantes} días`}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
