// components/flota/DocumentosVehiculo.jsx
// Modal de documentos legales de un vehículo — subida de PDF + historial
import { useState, useRef } from 'react'
import { FileText, Upload, Eye, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { useDocumentosVehiculo, useCrearDocumento } from '../../hooks/useFlota'

const TIPOS = [
  { value: 'REVISION_TECNICA',    label: 'Revisión Técnica' },
  { value: 'PERMISO_CIRCULACION', label: 'Permiso de Circulación' },
  { value: 'SOAP',                label: 'SOAP' },
  { value: 'SEGURO_VOLUNTARIO',   label: 'Seguro Voluntario' },
  { value: 'OTRO',                label: 'Otro documento' },
]

const TIPO_LABEL = Object.fromEntries(TIPOS.map(t => [t.value, t.label]))

function alertaBadge(doc) {
  if (!doc.activo) return null
  if (!doc.fechaVencimiento) return null
  const dias = Math.ceil((new Date(doc.fechaVencimiento) - new Date()) / (1000 * 60 * 60 * 24))
  if (dias < 0)   return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]"><XCircle className="w-3 h-3"/>Vencido</span>
  if (dias <= 15)  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D]"><AlertTriangle className="w-3 h-3"/>{dias}d</span>
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC]"><CheckCircle className="w-3 h-3"/>Vigente</span>
}

function abrirPDF(base64, nombre) {
  // base64 puede venir con o sin el prefijo data:
  const dataUrl = base64.startsWith('data:')
    ? base64
    : `data:application/pdf;base64,${base64}`
  const a = document.createElement('a')
  a.href = dataUrl
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export default function DocumentosVehiculo({ vehiculo, onClose }) {
  const { data: docs, loading, error, refetch } = useDocumentosVehiculo(vehiculo.id)
  const { execute, loading: guardando } = useCrearDocumento()

  const [form, setForm] = useState({
    tipo: '', fechaVencimiento: '', fechaEmision: '',
    numeroDocumento: '', monto: '',
  })
  const [archivo, setArchivo]     = useState(null)   // { base64, nombre }
  const [uploadError, setUploadError] = useState(null)
  const [formError, setFormError] = useState(null)
  const fileRef = useRef()

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  function handleFile(e) {
    setUploadError(null)
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setUploadError('Solo se aceptan archivos PDF')
      return
    }
    if (file.size > 4.5 * 1024 * 1024) {
      setUploadError('El PDF no puede superar 4.5 MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setArchivo({ base64: reader.result, nombre: file.name })
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError(null)
    if (!form.tipo || !form.fechaVencimiento) {
      setFormError('Tipo y fecha de vencimiento son obligatorios')
      return
    }
    try {
      await execute(vehiculo.id, {
        tipo:            form.tipo,
        fechaVencimiento: form.fechaVencimiento,
        fechaEmision:    form.fechaEmision    || undefined,
        numeroDocumento: form.numeroDocumento || undefined,
        monto:           form.monto ? Number(form.monto) : undefined,
        archivoBase64:   archivo?.base64  || undefined,
        archivoNombre:   archivo?.nombre  || undefined,
      })
      setForm({ tipo: '', fechaVencimiento: '', fechaEmision: '', numeroDocumento: '', monto: '' })
      setArchivo(null)
      if (fileRef.current) fileRef.current.value = ''
      refetch()
    } catch (err) {
      setFormError(err.message)
    }
  }

  // Agrupar por tipo, mostrar solo el activo (más reciente)
  const activos = (docs ?? []).filter(d => d.activo)
  const historial = (docs ?? []).filter(d => !d.activo)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-6 px-4">
      <div className="bg-white border border-[#E1E4E8] rounded-2xl w-full max-w-2xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E1E4E8]">
          <div>
            <h2 className="text-base font-bold text-[#252A31] flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              Documentos legales
            </h2>
            <p className="text-xs text-[#737B86] mt-0.5 font-mono">
              {vehiculo.patente} · {vehiculo.marca} {vehiculo.modelo}
            </p>
          </div>
          <button onClick={onClose} className="text-[#737B86] hover:text-[#252A31] text-xl leading-none transition-colors">×</button>
        </div>

        <div className="p-6 space-y-6">

          {/* ——— Documentos vigentes ——— */}
          <section>
            <h3 className="text-xs font-bold text-[#737B86] uppercase tracking-widest mb-3">
              Documentos vigentes
            </h3>

            {loading && <p className="text-[#737B86] text-sm">Cargando…</p>}
            {error   && <p className="text-red-500 text-sm">Error: {error}</p>}

            {!loading && activos.length === 0 && (
              <p className="text-[#737B86] text-sm italic">Sin documentos ingresados</p>
            )}

            {activos.length > 0 && (
              <div className="space-y-2">
                {activos.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between bg-[#F4F5F6] border border-[#E1E4E8] rounded-xl px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[#252A31]">
                          {TIPO_LABEL[doc.tipo] ?? doc.tipo}
                        </span>
                        {alertaBadge(doc)}
                      </div>
                      <div className="text-xs text-[#737B86] mt-0.5">
                        Vence: {new Date(doc.fechaVencimiento).toLocaleDateString('es-CL')}
                        {doc.numeroDocumento && ` · N° ${doc.numeroDocumento}`}
                      </div>
                    </div>
                    {doc.archivoBase64 ? (
                      <button
                        onClick={() => abrirPDF(doc.archivoBase64, doc.archivoNombre)}
                        className="ml-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors whitespace-nowrap"
                      >
                        <Eye className="w-3 h-3" />
                        Ver PDF
                      </button>
                    ) : (
                      <span className="ml-3 text-xs text-[#A0A6AE] italic">Sin PDF</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ——— Agregar / actualizar documento ——— */}
          <section>
            <h3 className="text-xs font-bold text-[#737B86] uppercase tracking-widest mb-3">
              Agregar / actualizar documento
            </h3>
            <p className="text-xs text-[#A0A6AE] mb-4">
              Si ya existe un documento del mismo tipo, se reemplazará automáticamente. El anterior queda en el historial.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipo + vencimiento */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tipo *">
                  <select required value={form.tipo} onChange={e => set('tipo', e.target.value)} className={INPUT}>
                    <option value="">Seleccionar…</option>
                    {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
                <Field label="Fecha de vencimiento *">
                  <input required type="date" value={form.fechaVencimiento}
                    onChange={e => set('fechaVencimiento', e.target.value)} className={INPUT} />
                </Field>
              </div>

              {/* Emisión + número */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha de emisión">
                  <input type="date" value={form.fechaEmision}
                    onChange={e => set('fechaEmision', e.target.value)} className={INPUT} />
                </Field>
                <Field label="N° documento">
                  <input type="text" value={form.numeroDocumento} placeholder="Ej: 12345678"
                    onChange={e => set('numeroDocumento', e.target.value)} className={INPUT} />
                </Field>
              </div>

              {/* PDF upload */}
              <Field label="Archivo PDF (opcional)">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-[#F4F5F6] border border-[#E1E4E8] rounded-lg text-sm text-[#737B86] hover:border-amber-500 hover:text-amber-600 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    {archivo ? archivo.nombre : 'Seleccionar PDF…'}
                    <input ref={fileRef} type="file" accept="application/pdf"
                      onChange={handleFile} className="hidden" />
                  </label>
                  {archivo && (
                    <button type="button" onClick={() => { setArchivo(null); if (fileRef.current) fileRef.current.value = '' }}
                      className="text-[#737B86] hover:text-red-500 text-xs transition-colors">
                      Quitar
                    </button>
                  )}
                </div>
                {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
                <p className="text-xs text-[#A0A6AE] mt-1">Máximo 4.5 MB · Solo PDF</p>
              </Field>

              {formError && (
                <p className="text-[#DC2626] text-sm bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={onClose}
                  className="px-4 py-2 text-sm font-semibold text-[#737B86] hover:text-[#252A31] transition-colors">
                  Cerrar
                </button>
                <button type="submit" disabled={guardando}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold text-sm px-5 py-2 rounded-lg transition-colors">
                  {guardando ? 'Guardando…' : 'Guardar documento'}
                </button>
              </div>
            </form>
          </section>

          {/* ——— Historial ——— */}
          {historial.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-[#737B86] uppercase tracking-widest mb-3">
                Historial (períodos anteriores)
              </h3>
              <div className="space-y-1.5">
                {historial.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between bg-[#F4F5F6] border border-[#E1E4E8] rounded-lg px-4 py-2.5 opacity-60">
                    <div>
                      <span className="text-xs font-semibold text-[#737B86]">
                        {TIPO_LABEL[doc.tipo] ?? doc.tipo}
                      </span>
                      <span className="text-xs text-[#A0A6AE] ml-2">
                        venció {new Date(doc.fechaVencimiento).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                    {doc.archivoBase64 && (
                      <button onClick={() => abrirPDF(doc.archivoBase64, doc.archivoNombre)}
                        className="ml-3 text-xs text-[#737B86] hover:text-[#252A31] transition-colors">
                        Ver PDF
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
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
