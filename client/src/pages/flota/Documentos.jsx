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
  VENCIDO: { label: 'Vencido',  cls: 'bg-red-400/10 text-red-400 border-red-400/30' },
  CRITICO: { label: '≤ 15 días', cls: 'bg-amber-400/10 text-amber-400 border-amber-400/30' },
  PROXIMO: { label: 'Próximo',  cls: 'bg-zinc-700/50 text-zinc-300 border-zinc-700' },
}

export default function FlotaDocumentos() {
  const { data: docs60, loading, error } = useVencimientos(60)
  const docs = docs60 ?? []

  const vencidos = docs.filter(d => d.alerta === 'VENCIDO')
  const criticos = docs.filter(d => d.alerta === 'CRITICO')
  const proximos  = docs.filter(d => d.alerta === 'PROXIMO')

  return (
    <div className="p-7">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Documentos legales</h1>
        <p className="text-sm text-zinc-500 mt-1">Vencimientos en los próximos 60 días</p>
      </div>

      {loading && <p className="text-zinc-500 text-sm">Cargando…</p>}
      {error   && <p className="text-red-400 text-sm">Error: {error}</p>}

      {!loading && docs.length === 0 && (
        <div className="bg-[#222] border border-[#363636] rounded-xl p-10 text-center">
          <div className="text-green-400 text-2xl mb-2">✓</div>
          <p className="text-zinc-400 text-sm">Todos los documentos están vigentes por más de 60 días</p>
        </div>
      )}

      {[
        { grupo: vencidos, titulo: 'Documentos vencidos',   nivel: 'VENCIDO' },
        { grupo: criticos, titulo: 'Críticos (≤ 15 días)',  nivel: 'CRITICO' },
        { grupo: proximos,  titulo: 'Próximos a vencer',     nivel: 'PROXIMO' },
      ].map(({ grupo, titulo, nivel }) => grupo.length > 0 && (
        <div key={nivel} className="mb-6">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">{titulo}</h2>
          <div className="bg-[#222] border border-[#363636] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#363636] text-xs text-zinc-500 font-semibold uppercase tracking-wide">
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
                    <tr key={doc.id} className="border-b border-[#363636] last:border-0 hover:bg-[#2b2b2b] transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-white font-mono text-xs">{doc.vehiculo?.patente}</div>
                        <div className="text-xs text-zinc-400">{doc.vehiculo?.marca} {doc.vehiculo?.modelo}</div>
                      </td>
                      <td className="px-4 py-3 text-zinc-300">
                        {TIPO_LABELS[doc.tipo] ?? doc.tipo}
                      </td>
                      <td className="px-4 py-3 text-zinc-300 font-mono text-xs">{fechaStr}</td>
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
