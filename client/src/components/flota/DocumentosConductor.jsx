// components/flota/DocumentosConductor.jsx
// Modal de documentos del conductor — licencia, cédula, etc.
import { useState, useRef, useEffect, useCallback } from 'react'
import { FileText, Upload, Eye, AlertTriangle, CheckCircle, XCircle, Pencil } from 'lucide-react'
import api from '../../lib/api'

const TIPOS = [
  { value: 'LICENCIA_CONDUCIR',        label: 'Licencia de conducir' },
  { value: 'CEDULA_IDENTIDAD',         label: 'Cédula de identidad' },
  { value: 'CERTIFICADO_ANTECEDENTES', label: 'Certificado de antecedentes' },
  { value: 'OTRO',                     label: 'Otro documento' },
]

const TIPO_LABEL = Object.fromEntries(TIPOS.map(t => [t.value, t.label]))

// Categorías de licencia chilena
const CATEGORIAS_LICENCIA = ['A1', 'A2', 'A3', 'A4', 'B', 'C', 'D', 'F']

function alertaBadge(doc) {
  if (!doc.fechaVencimiento) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F4F5F6] text-[#737B86] border border-[#E1E4E8]">Sin vencimiento</span>
  const dias = Math.ceil((new Date(doc.fechaVencimiento) - new Date()) / (1000 * 60 * 60 * 24))
  if (dias < 0)   return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]"><XCircle className="w-3 h-3"/>Vencida</span>
  if (dias <= 15)  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D]"><AlertTriangle className="w-3 h-3"/>{dias}d</span>
  if (dias <= 60)  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047]"><AlertTriangle className="w-3 h-3"/>{dias}d</span>
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC]"><CheckCircle className="w-3 h-3"/>Vigente</span>
}

function abrirArchivo(base64, nombre) {
  const dataUrl = base64.startsWith('data:') ? base64 : `data:application/pdf;base64,${base64}`
  const a = document.createElement('a')
  a.href = dataUrl
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

const FORM_VACIO = {
  tipo: '', fechaEmision: '', fechaVencimiento: '',
  numeroDocumento: '', categoria: '',
}

export default function DocumentosConductor({ conductor, onClose }) {
  const [docs,     setDocs]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [loadErr,  setLoadErr]  = useState(null)

  const [form,       setForm]       = useState(FORM_VACIO)
  const [archivo,    setArchivo]    = useState(null)
  const [uploadErr,  setUploadErr]  = useState(null)
  const [formErr,    setFormErr]    = useState(null)
  const [guardando,  setGuardando]  = useState(false)
  const [editingId,  setEditingId]  = useState(null)

  const fileRef = useRef()
  const formRef = useRef()

  const cargarDocs = useCallback(async () => {
    try {
      setLoading(true)
      setLoadErr(null)
      const { data } = await api.get(`/flota/documentos/conductor/${conductor.id}`)
      setDocs(data)
    } catch (err) {
      setLoadErr('No se pudieron cargar los documentos')
    } finally {
      setLoading(false)
    }
  }, [conductor.id])

  useEffect(() => { cargarDocs() }, [cargarDocs])

  function set(k, v) {
    setForm(prev => {
      const next = { ...prev, [k]: v }
      // Si se cambia el tipo y no es licencia, limpiar categoría
      if (k === 'tipo' && v !== 'LICENCIA_CONDUCIR') next.categoria = ''
      return next
    })
  }

  function handleFile(e) {
    setUploadErr(null)
    const file = e.target.files?.[0]
    if (!file) return
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadErr('Solo se aceptan PDF o imágenes (JPG, PNG)')
      return
    }
    if (file.size > 4.5 * 1024 * 1024) {
      setUploadErr('El archivo no puede superar 4.5 MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setArchivo({ base64: reader.result, nombre: file.name })
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormErr(null)
    if (!form.tipo) {
      setFormErr('El tipo de documento es obligatorio')
      return
    }
    setGuardando(true)
    try {
      const payload = {
        tipo:             form.tipo,
        fechaEmision:     form.fechaEmision     || undefined,
        fechaVencimiento: form.fechaVencimiento || undefined,
        numeroDocumento:  form.numeroDocumento  || undefined,
        categoria:        form.categoria        || undefined,
        archivoBase64:    archivo?.base64       || undefined,
        archivoNombre:    archivo?.nombre       || undefined,
      }

      if (editingId) {
        await api.put(`/flota/documentos/conductor/doc/${editingId}`, payload)
      } else {
        await api.post(`/flota/documentos/conductor/${conductor.id}`, payload)
      }

      setForm(FORM_VACIO)
      setArchivo(null)
      if (fileRef.current) fileRef.current.value = ''
      setEditingId(null)
      cargarDocs()
    } catch (err) {
      setFormErr(err.response?.data?.error || err.message || 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  function cargarEnForm(doc) {
    setForm({
      tipo:             doc.tipo,
      fechaEmision:     doc.fechaEmision     ? doc.fechaEmision.slice(0, 10)     : '',
      fechaVencimiento: doc.fechaVencimiento ? doc.fechaVencimiento.slice(0, 10) : '',
      numeroDocumento:  doc.numeroDocumento  ?? '',
      categoria:        doc.categoria        ?? '',
    })
    setArchivo(null)
    if (fileRef.current) fileRef.current.value = ''
    setFormErr(null)
    setEditingId(doc.id)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  function limpiarForm() {
    setForm(FORM_VACIO)
    setArchivo(null)
    if (fileRef.current) fileRef.current.value = ''
    setFormErr(null)
    setEditingId(null)
  }

  const activos   = docs.filter(d => d.activo)
  const historial = docs.filter(d => !d.activo)
  const esLicencia = form.tipo === 'LICENCIA_CONDUCIR'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-6 px-4">
      <div className="bg-white border border-[#E1E4E8] rounded-2xl w-full max-w-2xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E1E4E8]">
          <div>
            <h2 className="text-base font-bold text-[#252A31] flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              Documentos del conductor
            </h2>
            <p className="text-xs text-[#737B86] mt-0.5">
              {conductor.nombre}{conductor.rut ? ` · ${conductor.rut}` : ''}
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
            {loadErr && <p className="text-red-500 text-sm">{loadErr}</p>}

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
                        {doc.categoria && (
                          <span className="text-xs font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                            Cat. {doc.categoria}
                          </span>
                        )}
                        {alertaBadge(doc)}
                      </div>
                      <div className="text-xs text-[#737B86] mt-0.5">
                        {doc.fechaVencimiento
                          ? `Vence: ${new Date(doc.fechaVencimiento).toLocaleDateString('es-CL')}`
                          : 'Sin fecha de vencimiento'}
                        {doc.numeroDocumento && ` · N° ${doc.numeroDocumento}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <button
                        onClick={() => cargarEnForm(doc)}
                        title="Editar documento"
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#737B86] bg-white border border-[#E1E4E8] rounded-lg hover:border-amber-400 hover:text-amber-600 transition-colors whitespace-nowrap"
                      >
                        <Pencil className="w-3 h-3" />
                        Editar
                      </button>
                      {doc.archivoBase64 ? (
                        <button
                          onClick={() => abrirArchivo(doc.archivoBase64, doc.archivoNombre)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors whitespace-nowrap"
                        >
                          <Eye className="w-3 h-3" />
                          Ver archivo
                        </button>
                      ) : (
                        <span className="text-xs text-[#A0A6AE] italic">Sin archivo</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ——— Agregar / actualizar ——— */}
          <section ref={formRef} className={editingId ? 'ring-2 ring-amber-400 rounded-xl p-4 -mx-1' : ''}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-[#737B86] uppercase tracking-widest">
                {editingId ? '✏️ Editando documento' : 'Agregar / actualizar documento'}
              </h3>
              {editingId && (
                <button type="button" onClick={limpiarForm}
                  className="text-xs text-[#737B86] hover:text-[#252A31] transition-colors">
                  Cancelar edición
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipo */}
              <Field label="Tipo *">
                <select required value={form.tipo} onChange={e => set('tipo', e.target.value)} className={INPUT}>
                  <option value="">Seleccionar…</option>
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>

              {/* Categoría (solo para licencia) */}
              {esLicencia && (
                <Field label="Categoría de licencia">
                  <select value={form.categoria} onChange={e => set('categoria', e.target.value)} className={INPUT}>
                    <option value="">No especificar</option>
                    {CATEGORIAS_LICENCIA.map(c => <option key={c} value={c}>Clase {c}</option>)}
                  </select>
                </Field>
              )}

              {/* Fecha de vencimiento */}
              <Field label={esLicencia ? 'Fecha de vencimiento (obligatoria)' : 'Fecha de vencimiento'}>
                <input
                  type="date"
                  value={form.fechaVencimiento}
                  onChange={e => set('fechaVencimiento', e.target.value)}
                  required={esLicencia}
                  className={INPUT}
                />
                {!esLicencia && (
                  <p className="text-xs text-[#A0A6AE] mt-1">Deja vacío si el documento no vence</p>
                )}
              </Field>

              {/* Emisión + número */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha de emisión">
                  <input type="date" value={form.fechaEmision}
                    onChange={e => set('fechaEmision', e.target.value)} className={INPUT} />
                </Field>
                <Field label="N° documento">
                  <input type="text" value={form.numeroDocumento}
                    placeholder={esLicencia ? 'Ej: 12.345.678-9' : 'Número o código'}
                    onChange={e => set('numeroDocumento', e.target.value)} className={INPUT} />
                </Field>
              </div>

              {/* Archivo */}
              <Field label="Archivo (PDF o imagen, opcional)">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-[#F4F5F6] border border-[#E1E4E8] rounded-lg text-sm text-[#737B86] hover:border-amber-500 hover:text-amber-600 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    {archivo ? archivo.nombre : 'Seleccionar archivo…'}
                    <input ref={fileRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp"
                      onChange={handleFile} className="hidden" />
                  </label>
                  {archivo && (
                    <button type="button" onClick={() => { setArchivo(null); if (fileRef.current) fileRef.current.value = '' }}
                      className="text-[#737B86] hover:text-red-500 text-xs transition-colors">
                      Quitar
                    </button>
                  )}
                </div>
                {uploadErr && <p className="text-red-500 text-xs mt-1">{uploadErr}</p>}
                <p className="text-xs text-[#A0A6AE] mt-1">Máximo 4.5 MB · PDF, JPG o PNG</p>
              </Field>

              {formErr && (
                <p className="text-[#DC2626] text-sm bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg px-3 py-2">
                  {formErr}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={onClose}
                  className="px-4 py-2 text-sm font-semibold text-[#737B86] hover:text-[#252A31] transition-colors">
                  Cerrar
                </button>
                <button type="submit" disabled={guardando}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold text-sm px-5 py-2 rounded-lg transition-colors">
                  {guardando ? 'Guardando…' : editingId ? 'Actualizar documento' : 'Guardar documento'}
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
                      {doc.fechaVencimiento && (
                        <span className="text-xs text-[#A0A6AE] ml-2">
                          venció {new Date(doc.fechaVencimiento).toLocaleDateString('es-CL')}
                        </span>
                      )}
                    </div>
                    {doc.archivoBase64 && (
                      <button onClick={() => abrirArchivo(doc.archivoBase64, doc.archivoNombre)}
                        className="ml-3 text-xs text-[#737B86] hover:text-[#252A31] transition-colors">
                        Ver archivo
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
