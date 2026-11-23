// components/flota/DocumentosVehiculo.jsx
// Modal de documentos legales de un vehículo — subida de PDF + historial
import { useState, useRef } from 'react'
import { FileText, Upload, Eye, AlertTriangle, CheckCircle, XCircle, Pencil } from 'lucide-react'
import { useDocumentosVehiculo, useCrearDocumento } from '../../hooks/useFlota'
import api from '../../lib/api'

const TIPOS = [
  { value: 'REVISION_TECNICA',    label: 'Revisión Técnica' },
  { value: 'PERMISO_CIRCULACION', label: 'Permiso de Circulación' },
  { value: 'SOAP',                label: 'SOAP' },
  { value: 'SEGURO_VOLUNTARIO',   label: 'Seguro Voluntario' },
  { value: 'OTRO',                label: 'Otro documento' },
]

const TIPO_LABEL = Object.fromEntries(TIPOS.map(t => [t.value, t.label]))

// Fechas fijas para Permiso de Circulación en Chile
function getFechaPermiso(cuotas, year) {
  const y = year ?? new Date().getFullYear()
  return cuotas === 2
    ? `${y}-08-31`   // 31 agosto → 2 cuotas
    : `${y}-03-31`   // 31 marzo  → 1 cuota
}

function alertaBadge(doc) {
  if (!doc.activo) return null
  if (!doc.fechaVencimiento) return null
  const dias = Math.ceil((new Date(doc.fechaVencimiento) - new Date()) / (1000 * 60 * 60 * 24))
  if (dias < 0)   return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]"><XCircle className="w-3 h-3"/>Vencido</span>
  if (dias <= 15)  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D]"><AlertTriangle className="w-3 h-3"/>{dias}d</span>
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC]"><CheckCircle className="w-3 h-3"/>Vigente</span>
}

function cuotaBadge(doc) {
  if (doc.tipo !== 'PERMISO_CIRCULACION' || doc.cuotas !== 2) return null
  if (doc.segundaCuotaPagada) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC]">
        <CheckCircle className="w-3 h-3"/>2ª cuota pagada
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D]">
      <AlertTriangle className="w-3 h-3"/>2ª cuota pendiente
    </span>
  )
}

function abrirPDF(base64, nombre) {
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
    numeroDocumento: '', monto: '', proveedor: '',
    cuotas: 1, anioPermiso: new Date().getFullYear(),
  })
  const [archivo, setArchivo]       = useState(null)
  const [uploadError, setUploadError] = useState(null)
  const [formError, setFormError]   = useState(null)

  // Estado para modal de segunda cuota
  const [modalCuota, setModalCuota] = useState(null)   // doc completo
  const [cuotaFecha, setCuotaFecha] = useState('')
  const [cuotaGuardando, setCuotaGuardando] = useState(false)
  const [cuotaError, setCuotaError] = useState(null)

  // Estado para indicar qué doc se está editando (resaltar form)
  const [editingId, setEditingId] = useState(null)

  const fileRef = useRef()
  const formRef = useRef()

  const esPermiso = form.tipo === 'PERMISO_CIRCULACION'

  function set(k, v) {
    setForm(p => {
      const next = { ...p, [k]: v }
      const tipo       = k === 'tipo' ? v : next.tipo
      const emision    = k === 'fechaEmision' ? v : next.fechaEmision

      // Auto-calcular vencimiento para Permiso de Circulación (por cuotas/año)
      if ((k === 'tipo' && v === 'PERMISO_CIRCULACION') || k === 'cuotas' || k === 'anioPermiso') {
        const cuotas = k === 'cuotas' ? Number(v) : Number(next.cuotas)
        const year   = k === 'anioPermiso' ? Number(v) : Number(next.anioPermiso)
        if (tipo === 'PERMISO_CIRCULACION') {
          next.fechaVencimiento = getFechaPermiso(cuotas, year)
        }
      }

      // Auto-calcular vencimiento para SOAP y Revisión Técnica al cambiar emisión o tipo
      if (k === 'fechaEmision' || k === 'tipo') {
        if (emision && (tipo === 'SOAP' || tipo === 'REVISION_TECNICA')) {
          const d = new Date(emision + 'T12:00:00')
          const nextYear = d.getFullYear() + 1
          if (tipo === 'SOAP') {
            // SOAP: siempre vence el 31 de marzo del año siguiente
            next.fechaVencimiento = `${nextYear}-03-31`
          } else {
            // Revisión Técnica: vence el último día del mismo mes, año siguiente
            const mes = d.getMonth() // 0-based
            const ultimoDia = new Date(nextYear, mes + 1, 0).getDate()
            const mesStr = String(mes + 1).padStart(2, '0')
            next.fechaVencimiento = `${nextYear}-${mesStr}-${ultimoDia}`
          }
        }
        // Si cambia tipo y no aplica auto-cálculo, limpiar vencimiento previo auto
        if (k === 'tipo' && v !== 'PERMISO_CIRCULACION' && v !== 'SOAP' && v !== 'REVISION_TECNICA') {
          next.fechaVencimiento = ''
        }
      }

      // Reset cuotas al cambiar a otro tipo
      if (k === 'tipo' && v !== 'PERMISO_CIRCULACION') {
        next.cuotas = 1
      }
      return next
    })
  }

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
        proveedor:       form.proveedor       || undefined,
        archivoBase64:   archivo?.base64  || undefined,
        archivoNombre:   archivo?.nombre  || undefined,
        cuotas:          esPermiso ? Number(form.cuotas) : 1,
      })
      setForm({
        tipo: '', fechaVencimiento: '', fechaEmision: '',
        numeroDocumento: '', monto: '', proveedor: '', cuotas: 1,
        anioPermiso: new Date().getFullYear(),
      })
      setArchivo(null)
      if (fileRef.current) fileRef.current.value = ''
      setEditingId(null)
      refetch()
    } catch (err) {
      setFormError(err.message)
    }
  }

  async function guardarSegundaCuota() {
    if (!cuotaFecha) {
      setCuotaError('Ingresa la fecha de pago')
      return
    }
    setCuotaError(null)
    setCuotaGuardando(true)
    try {
      await api.put(`/flota/documentos/${modalCuota.id}`, {
        segundaCuotaPagada: true,
        segundaCuotaFecha: cuotaFecha,
      })
      setModalCuota(null)
      setCuotaFecha('')
      refetch()
    } catch (err) {
      setCuotaError(err.message)
    } finally {
      setCuotaGuardando(false)
    }
  }

  function cargarEnForm(doc) {
    // Calcula anioPermiso desde fechaVencimiento si es PERMISO_CIRCULACION
    let anioPermiso = new Date().getFullYear()
    if (doc.tipo === 'PERMISO_CIRCULACION' && doc.fechaVencimiento) {
      anioPermiso = new Date(doc.fechaVencimiento).getFullYear()
    }
    setForm({
      tipo:            doc.tipo,
      fechaVencimiento: doc.fechaVencimiento ? doc.fechaVencimiento.slice(0, 10) : '',
      fechaEmision:    doc.fechaEmision ? doc.fechaEmision.slice(0, 10) : '',
      numeroDocumento: doc.numeroDocumento ?? '',
      monto:           doc.monto != null ? String(doc.monto) : '',
      proveedor:       doc.proveedor ?? '',
      cuotas:          doc.cuotas ?? 1,
      anioPermiso,
    })
    setArchivo(null)
    if (fileRef.current) fileRef.current.value = ''
    setFormError(null)
    setEditingId(doc.id)
    // Scroll al formulario
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  function limpiarForm() {
    setForm({
      tipo: '', fechaVencimiento: '', fechaEmision: '',
      numeroDocumento: '', monto: '', proveedor: '', cuotas: 1,
      anioPermiso: new Date().getFullYear(),
    })
    setArchivo(null)
    if (fileRef.current) fileRef.current.value = ''
    setFormError(null)
    setEditingId(null)
  }

  const activos   = (docs ?? []).filter(d => d.activo)
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
                        {cuotaBadge(doc)}
                      </div>
                      <div className="text-xs text-[#737B86] mt-0.5">
                        Vence: {new Date(doc.fechaVencimiento).toLocaleDateString('es-CL')}
                        {doc.numeroDocumento && ` · N° ${doc.numeroDocumento}`}
                        {doc.tipo === 'PERMISO_CIRCULACION' && doc.cuotas === 2 && (
                          <span className="ml-1">· 2 cuotas</span>
                        )}
                        {doc.proveedor && (
                          <span className="ml-1">· {doc.proveedor}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      {/* Botón editar */}
                      <button
                        onClick={() => cargarEnForm(doc)}
                        title="Editar documento"
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#737B86] bg-white border border-[#E1E4E8] rounded-lg hover:border-amber-400 hover:text-amber-600 transition-colors whitespace-nowrap"
                      >
                        <Pencil className="w-3 h-3" />
                        Editar
                      </button>
                      {/* Botón registrar 2ª cuota */}
                      {doc.tipo === 'PERMISO_CIRCULACION' && doc.cuotas === 2 && !doc.segundaCuotaPagada && (
                        <button
                          onClick={() => { setModalCuota(doc); setCuotaFecha(''); setCuotaError(null) }}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors whitespace-nowrap"
                        >
                          Registrar 2ª cuota
                        </button>
                      )}
                      {doc.archivoBase64 ? (
                        <button
                          onClick={() => abrirPDF(doc.archivoBase64, doc.archivoNombre)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors whitespace-nowrap"
                        >
                          <Eye className="w-3 h-3" />
                          Ver PDF
                        </button>
                      ) : (
                        <span className="text-xs text-[#A0A6AE] italic">Sin PDF</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ——— Agregar / actualizar documento ——— */}
          <section ref={formRef} className={editingId ? 'ring-2 ring-amber-400 rounded-xl p-4 -mx-1' : ''}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-[#737B86] uppercase tracking-widest">
                {editingId ? '✏️ Editando documento' : 'Agregar / actualizar documento'}
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={limpiarForm}
                  className="text-xs text-[#737B86] hover:text-[#252A31] transition-colors"
                >
                  Cancelar edición
                </button>
              )}
            </div>
            <p className="text-xs text-[#A0A6AE] mb-4">
              {editingId
                ? 'Modifica los datos y guarda para actualizar. El documento anterior quedará en el historial.'
                : 'Si ya existe un documento del mismo tipo, se reemplazará automáticamente. El anterior queda en el historial.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipo */}
              <Field label="Tipo *">
                <select required value={form.tipo} onChange={e => set('tipo', e.target.value)} className={INPUT}>
                  <option value="">Seleccionar…</option>
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>

              {/* Opciones específicas de Permiso de Circulación */}
              {esPermiso && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-amber-800">Permiso de Circulación</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Cuotas">
                      <select value={form.cuotas} onChange={e => set('cuotas', Number(e.target.value))} className={INPUT}>
                        <option value={1}>1 cuota — vence 31 marzo</option>
                        <option value={2}>2 cuotas — vence 31 agosto</option>
                      </select>
                    </Field>
                    <Field label="Año del permiso">
                      <input
                        type="number" min="2020" max="2040" value={form.anioPermiso}
                        onChange={e => set('anioPermiso', e.target.value)}
                        className={INPUT}
                      />
                    </Field>
                  </div>
                  <p className="text-xs text-amber-700">
                    Fecha de vencimiento calculada automáticamente: <strong>{form.fechaVencimiento ? new Date(form.fechaVencimiento + 'T12:00:00').toLocaleDateString('es-CL') : '—'}</strong>
                  </p>
                </div>
              )}

              {/* Vencimiento (oculto para Permiso, ya que se auto-calcula) */}
              {!esPermiso && (
                <Field label="Fecha de vencimiento *">
                  <input required type="date" value={form.fechaVencimiento}
                    onChange={e => set('fechaVencimiento', e.target.value)} className={INPUT} />
                  {(form.tipo === 'SOAP' || form.tipo === 'REVISION_TECNICA') && form.fechaVencimiento && form.fechaEmision && (
                    <p className="text-xs text-[#737B86] mt-1">
                      Calculado automáticamente desde la fecha de emisión · puedes ajustarlo si es necesario
                    </p>
                  )}
                </Field>
              )}

              {/* Proveedor / Aseguradora / Nombre (condicional por tipo) */}
              {(form.tipo === 'SEGURO_VOLUNTARIO' || form.tipo === 'SOAP' || form.tipo === 'OTRO') && (
                <Field label={
                  form.tipo === 'SEGURO_VOLUNTARIO' ? 'Aseguradora' :
                  form.tipo === 'SOAP'              ? 'Compañía / Proveedor' :
                                                      'Nombre del documento'
                }>
                  <input
                    type="text"
                    value={form.proveedor}
                    placeholder={
                      form.tipo === 'SEGURO_VOLUNTARIO' ? 'Ej: HDI, Mapfre, Renta Nacional…' :
                      form.tipo === 'SOAP'              ? 'Ej: HDI, BCI Seguros…' :
                                                          'Ej: Certificado de homologación…'
                    }
                    onChange={e => set('proveedor', e.target.value)}
                    className={INPUT}
                  />
                </Field>
              )}

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

      {/* ——— Modal: Registrar segunda cuota ——— */}
      {modalCuota && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl border border-[#E1E4E8] shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-[#252A31]">Registrar 2ª cuota pagada</h3>
            <p className="text-sm text-[#737B86]">
              Vehículo: <strong className="font-mono">{vehiculo.patente}</strong>
            </p>
            <Field label="Fecha de pago de la 2ª cuota *">
              <input
                type="date"
                value={cuotaFecha}
                onChange={e => setCuotaFecha(e.target.value)}
                className={INPUT}
              />
            </Field>
            {cuotaError && (
              <p className="text-[#DC2626] text-sm bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg px-3 py-2">
                {cuotaError}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setModalCuota(null); setCuotaFecha('') }}
                className="px-4 py-2 text-sm font-semibold text-[#737B86] hover:text-[#252A31] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarSegundaCuota}
                disabled={cuotaGuardando}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold text-sm px-5 py-2 rounded-lg transition-colors"
              >
                {cuotaGuardando ? 'Guardando…' : 'Confirmar pago'}
              </button>
            </div>
          </div>
        </div>
      )}
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
