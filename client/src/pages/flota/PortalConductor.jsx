// pages/flota/PortalConductor.jsx
// Vista exclusiva del conductor: su vehículo, documentos y registro de actividad
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearSession, estaAutenticado, getUsuario } from '../../lib/auth'
import api from '../../lib/api'

// ——— helpers ——————————————————————————————————————————
const TIPO_DOC = {
  REVISION_TECNICA:   'Revisión Técnica',
  SOAP:               'SOAP',
  PERMISO_CIRCULACION:'Permiso Circulación',
  SEGURO_VOLUNTARIO:  'Seguro Voluntario',
}

const ALERTA_COLOR = {
  VENCIDO: { bg: 'bg-red-500/15',    text: 'text-red-400',    dot: 'bg-red-500' },
  CRITICO: { bg: 'bg-amber-500/15',  text: 'text-amber-400',  dot: 'bg-amber-500' },
  VIGENTE: { bg: 'bg-emerald-500/15',text: 'text-emerald-400',dot: 'bg-emerald-500' },
}

function formatFecha(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ——— Componente principal ——————————————————————————————
export default function PortalConductor() {
  const navigate  = useNavigate()
  const usuario   = getUsuario()

  const [datos,         setDatos]         = useState(null)   // { conductor, vehiculo, vehiculos }
  const [vehiculoActivo, setVehiculoActivo] = useState(null)  // vehículo seleccionado
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')

  // Reportes
  const [verReportes,   setVerReportes]   = useState(false)
  const [anioReporte,   setAnioReporte]   = useState(new Date().getFullYear())
  const [reporteData,   setReporteData]   = useState(null)
  const [loadingRep,    setLoadingRep]    = useState(false)

  // Form actividad
  const [form,    setForm]    = useState({
    tipo:            'TRASLADO',
    fecha:           new Date().toISOString().slice(0, 10),
    notas:           '',
    odometroActual:  '',
    tipoCombustible: 'DIESEL',
    litros:          '',
    monto:           '',
    estacion:        '',
    autopista:       '',
    sentido:         'IDA',
    // TRASLADO
    destino:         '',
    motivo:          '',
    kmSalida:        '',
    kmLlegada:       '',
    // MANTENCION
    tipoMantencion:  '',
    taller:          '',
    costo:           '',
    numeroFolio:     '',
    proxFecha:       '',
    proxKm:          '',
  })
  const [enviando,   setEnviando]   = useState(false)
  const [exito,      setExito]      = useState('')
  const [errorForm,  setErrorForm]  = useState('')
  const [pdfModal,   setPdfModal]   = useState(null) // { dataUrl, nombre }

  useEffect(() => {
    if (!estaAutenticado()) {
      navigate('/admin/login', { replace: true })
      return
    }
    if (usuario?.rol !== 'conductor') {
      navigate('/flota', { replace: true })
      return
    }
    cargar()
  }, [])

  // Limpiar campos del formulario al cambiar de vehículo
  useEffect(() => {
    if (!vehiculoActivo) return
    setForm(prev => ({
      ...prev,
      odometroActual: '',
      litros: '', monto: '', estacion: '', autopista: '',
      destino: '', motivo: '', kmSalida: '', kmLlegada: '',
      tipoMantencion: '', taller: '', costo: '', numeroFolio: '', proxFecha: '', proxKm: '',
      notas: '',
      fecha: new Date().toISOString().slice(0, 10),
    }))
    setExito('')
    setErrorForm('')
  }, [vehiculoActivo?.id])

  async function cargar(mantenerVehiculo = false) {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/flota/portal/mi-vehiculo')
      setDatos(res.data)
      // Si ya hay un vehículo activo seleccionado, actualizar sus datos frescos
      if (mantenerVehiculo && vehiculoActivo) {
        const fresco = res.data.vehiculos?.find(v => v.id === vehiculoActivo.id)
        setVehiculoActivo(fresco || res.data.vehiculo)
      } else {
        setVehiculoActivo(res.data.vehiculo) // null si múltiples, objeto si uno solo
      }
    } catch (e) {
      setError(e.response?.data?.error || 'No se pudo cargar tu información')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorForm('')
    setExito('')
    if (!form.tipo || !form.fecha) {
      setErrorForm('Tipo y fecha son obligatorios')
      return
    }
    setEnviando(true)
    try {
      await api.post('/flota/portal/actividad', {
        ...form,
        vehiculoId:     vehiculoActivo.id,
        odometroActual: form.odometroActual ? Number(form.odometroActual) : undefined,
        litros:         form.litros         ? Number(form.litros)         : undefined,
        monto:          form.monto          ? Number(form.monto)          : undefined,
        kmSalida:       form.kmSalida       ? Number(form.kmSalida)       : undefined,
        kmLlegada:      form.kmLlegada      ? Number(form.kmLlegada)      : undefined,
        costo:          form.costo          ? Number(form.costo)          : undefined,
        proxKm:         form.proxKm         ? Number(form.proxKm)         : undefined,
      })
      setExito('Actividad registrada exitosamente')
      setForm(prev => ({
        ...prev,
        notas: '', odometroActual: '', litros: '', monto: '', estacion: '', autopista: '',
        destino: '', motivo: '', kmSalida: '', kmLlegada: '',
        tipoMantencion: '', taller: '', costo: '', numeroFolio: '', proxFecha: '', proxKm: '',
        fecha: new Date().toISOString().slice(0, 10),
      }))
      cargar(true) // refresca odómetro, mantiene el vehículo seleccionado
    } catch (e) {
      setErrorForm(e.response?.data?.error || 'Error al registrar actividad')
    } finally {
      setEnviando(false)
    }
  }

  async function cargarReportes(anio) {
    setLoadingRep(true)
    try {
      const res = await api.get(`/flota/portal/mis-reportes?anio=${anio}`)
      setReporteData(res.data)
    } catch (e) {
      setReporteData(null)
    } finally {
      setLoadingRep(false)
    }
  }

  function toggleReportes() {
    if (!verReportes && !reporteData) cargarReportes(anioReporte)
    setVerReportes(v => !v)
  }

  function cambiarAnio(a) {
    setAnioReporte(a)
    cargarReportes(a)
  }

  function handleSalir() {
    clearSession()
    navigate('/admin/login')
  }

  // ——— Layout ——————————————————————————————————————————
  return (
    <div className="min-h-screen bg-[#1C1F26] text-white">
      {/* Header */}
      <header className="border-b border-[#2d3039] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-amber-500 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path d="M5 17H3a1 1 0 0 1-1-1v-5l2.5-5H17l2.5 5H22v5a1 1 0 0 1-1 1h-2" />
              <circle cx="7.5" cy="17.5" r="2.5" />
              <circle cx="16.5" cy="17.5" r="2.5" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold leading-none">Portal Conductor</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">{usuario?.nombre}</div>
          </div>
        </div>
        <button
          onClick={handleSalir}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Salir
        </button>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {loading && (
          <div className="text-center py-16 text-zinc-500 text-sm">Cargando…</div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && datos && (
          <>
            {/* ——— Selector de vehículo (solo si hay más de uno) ——— */}
            {datos.vehiculos?.length > 1 && (
              <section className="bg-[#22252e] rounded-2xl border border-[#2d3039] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#2d3039] flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                  </svg>
                  <span className="text-sm font-semibold">Mis Vehículos</span>
                  <span className="ml-auto text-xs text-zinc-500">{datos.vehiculos.length} asignados</span>
                </div>
                <div className="p-3 flex flex-col gap-2">
                  {datos.vehiculos.map(v => {
                    const activo = vehiculoActivo?.id === v.id
                    // alerta más crítica entre los documentos
                    const alertas = v.documentos?.map(d => d.alerta) || []
                    const nivelAlerta = alertas.includes('VENCIDO') ? 'VENCIDO'
                      : alertas.includes('CRITICO') ? 'CRITICO' : null
                    return (
                      <button
                        key={v.id}
                        onClick={() => setVehiculoActivo(v)}
                        className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all border
                          ${activo
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'border-[#2d3039] hover:bg-[#2b2d35]'}`}
                      >
                        <div>
                          <div className={`text-sm font-bold tracking-wide ${activo ? 'text-amber-400' : 'text-white'}`}>
                            {v.patente}
                          </div>
                          <div className="text-xs text-zinc-400 mt-0.5">
                            {v.marca} {v.modelo} {v.anio}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {nivelAlerta && (
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                              ${nivelAlerta === 'VENCIDO' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                              {nivelAlerta === 'VENCIDO' ? 'Doc. vencido' : 'Doc. por vencer'}
                            </span>
                          )}
                          {activo && (
                            <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ——— Vehículo ——————————————————————————— */}
            {vehiculoActivo ? (
              <section className="bg-[#22252e] rounded-2xl border border-[#2d3039] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#2d3039] flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path d="M5 17H3a1 1 0 0 1-1-1v-5l2.5-5H17l2.5 5H22v5a1 1 0 0 1-1 1h-2" />
                    <circle cx="7.5" cy="17.5" r="2.5" />
                    <circle cx="16.5" cy="17.5" r="2.5" />
                  </svg>
                  <span className="text-sm font-semibold">
                    {datos.vehiculos?.length > 1 ? vehiculoActivo.patente : 'Mi Vehículo'}
                  </span>
                </div>
                <div className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-bold tracking-wide">{vehiculoActivo.patente}</div>
                      <div className="text-sm text-zinc-400 mt-0.5">
                        {vehiculoActivo.marca} {vehiculoActivo.modelo} {vehiculoActivo.anio}
                      </div>
                      {vehiculoActivo.color && (
                        <div className="text-xs text-zinc-500 mt-0.5">{vehiculoActivo.color}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-zinc-500 mb-0.5">Odómetro actual</div>
                      <div className="text-base font-semibold text-amber-400">
                        {vehiculoActivo.odometroActual.toLocaleString('es-CL')} km
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documentos */}
                {vehiculoActivo.documentos?.length > 0 && (
                  <div className="border-t border-[#2d3039] px-4 py-3">
                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                      Documentos
                    </div>
                    <div className="space-y-2">
                      {vehiculoActivo.documentos.map(doc => {
                        const c = ALERTA_COLOR[doc.alerta]
                        return (
                          <div key={doc.id} className={`flex items-center justify-between rounded-lg px-3 py-2 ${c.bg}`}>
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
                              <span className="text-sm font-medium truncate">{TIPO_DOC[doc.tipo] || doc.tipo}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              <div className="text-right">
                                <div className={`text-xs font-semibold ${c.text}`}>
                                  {doc.alerta === 'VENCIDO'
                                    ? `Venció ${formatFecha(doc.fechaVencimiento)}`
                                    : `Vence ${formatFecha(doc.fechaVencimiento)}`}
                                </div>
                                {doc.alerta !== 'VENCIDO' && (
                                  <div className="text-[11px] text-zinc-500">{doc.diasRestantes} días</div>
                                )}
                              </div>
                              {doc.archivoBase64 && (
                                <button
                                  onClick={() => {
                                    // Blob URL evita bloqueo de data: URLs en Chrome/Android
                                    const b64 = doc.archivoBase64.startsWith('data:')
                                      ? doc.archivoBase64.split(',')[1]
                                      : doc.archivoBase64
                                    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
                                    const blob = new Blob([bytes], { type: 'application/pdf' })
                                    const url = URL.createObjectURL(blob)
                                    setPdfModal({ dataUrl: url, nombre: doc.archivoNombre || TIPO_DOC[doc.tipo] || 'Documento' })
                                  }}
                                  className="flex-shrink-0 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                  title="Ver PDF"
                                >
                                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {(!vehiculoActivo.documentos || vehiculoActivo.documentos.length === 0) && (
                  <div className="border-t border-[#2d3039] px-4 py-3 text-xs text-zinc-500 text-center">
                    Sin documentos registrados
                  </div>
                )}
              </section>
            ) : (
              <section className="bg-[#22252e] rounded-2xl border border-[#2d3039] px-4 py-8 text-center">
                {datos.vehiculos?.length > 1
                  ? <div className="text-zinc-500 text-sm">Selecciona un vehículo arriba</div>
                  : <>
                      <div className="text-zinc-500 text-sm">No tienes un vehículo asignado</div>
                      <div className="text-zinc-600 text-xs mt-1">Consulta con el administrador de flota</div>
                    </>
                }
              </section>
            )}

            {/* ——— Registrar actividad ——————————————— */}
            {vehiculoActivo && (
              <section className="bg-[#22252e] rounded-2xl border border-[#2d3039] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#2d3039] flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span className="text-sm font-semibold">Registrar Actividad</span>
                </div>
                <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">

                  {exito && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 text-sm text-emerald-400">
                      {exito}
                    </div>
                  )}
                  {errorForm && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-sm text-red-400">
                      {errorForm}
                    </div>
                  )}

                  {/* Tipo */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Tipo de actividad</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { v: 'TRASLADO',    label: 'Traslado'   },
                        { v: 'KILOMETRAJE', label: 'Kilometraje'},
                        { v: 'COMBUSTIBLE', label: 'Combustible'},
                        { v: 'PEAJE',       label: 'Peaje'      },
                        { v: 'MANTENCION',  label: 'Mantención' },
                      ].map(({ v, label }) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setForm(p => ({ ...p, tipo: v }))}
                          className={`py-2 rounded-lg text-xs font-medium transition-all border
                            ${form.tipo === v
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                              : 'border-[#2d3039] text-zinc-400 hover:bg-[#2b2d35]'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fecha */}
                  <Field label="Fecha">
                    <input
                      type="date"
                      value={form.fecha}
                      onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))}
                      className="w-full bg-[#1C1F26] border border-[#2d3039] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                      required
                    />
                  </Field>

                  {/* Campos según tipo */}
                  {form.tipo === 'KILOMETRAJE' && (
                    <Field label="Odómetro actual (km)">
                      <input
                        type="number"
                        min={vehiculoActivo.odometroActual}
                        value={form.odometroActual}
                        onChange={e => setForm(p => ({ ...p, odometroActual: e.target.value }))}
                        placeholder={`Actual: ${vehiculoActivo.odometroActual.toLocaleString('es-CL')} km`}
                        className="w-full bg-[#1C1F26] border border-[#2d3039] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 placeholder-zinc-600"
                      />
                    </Field>
                  )}

                  {form.tipo === 'COMBUSTIBLE' && (
                    <>
                      <Field label="Tipo de combustible">
                        <select
                          value={form.tipoCombustible}
                          onChange={e => setForm(p => ({ ...p, tipoCombustible: e.target.value }))}
                          className="w-full bg-[#1C1F26] border border-[#2d3039] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                        >
                          <option value="DIESEL">Diesel</option>
                          <option value="BENCINA_93">Bencina 93</option>
                          <option value="BENCINA_95">Bencina 95</option>
                          <option value="BENCINA_97">Bencina 97</option>
                        </select>
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Litros">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.litros}
                            onChange={e => setForm(p => ({ ...p, litros: e.target.value }))}
                            placeholder="0.00"
                            className="w-full bg-[#1C1F26] border border-[#2d3039] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 placeholder-zinc-600"
                          />
                        </Field>
                        <Field label="Monto ($)">
                          <input
                            type="number"
                            min="0"
                            value={form.monto}
                            onChange={e => setForm(p => ({ ...p, monto: e.target.value }))}
                            placeholder="0"
                            className="w-full bg-[#1C1F26] border border-[#2d3039] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 placeholder-zinc-600"
                          />
                        </Field>
                      </div>
                      <Field label="Estación (opcional)">
                        <input
                          type="text"
                          value={form.estacion}
                          onChange={e => setForm(p => ({ ...p, estacion: e.target.value }))}
                          placeholder="Nombre o dirección"
                          className="w-full bg-[#1C1F26] border border-[#2d3039] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 placeholder-zinc-600"
                        />
                      </Field>
                      <Field label="Odómetro al cargar (opcional)">
                        <input
                          type="number"
                          value={form.odometroActual}
                          onChange={e => setForm(p => ({ ...p, odometroActual: e.target.value }))}
                          placeholder={`Actual: ${vehiculoActivo.odometroActual.toLocaleString('es-CL')} km`}
                          className="w-full bg-[#1C1F26] border border-[#2d3039] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 placeholder-zinc-600"
                        />
                      </Field>
                    </>
                  )}

                  {form.tipo === 'PEAJE' && (
                    <>
                      <Field label="Monto ($)">
                        <input
                          type="number"
                          min="0"
                          value={form.monto}
                          onChange={e => setForm(p => ({ ...p, monto: e.target.value }))}
                          placeholder="0"
                          className="w-full bg-[#1C1F26] border border-[#2d3039] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 placeholder-zinc-600"
                        />
                      </Field>
                      <Field label="Autopista (opcional)">
                        <input
                          type="text"
                          value={form.autopista}
                          onChange={e => setForm(p => ({ ...p, autopista: e.target.value }))}
                          placeholder="Ej: Autopista Central"
                          className="w-full bg-[#1C1F26] border border-[#2d3039] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 placeholder-zinc-600"
                        />
                      </Field>
                      <Field label="Sentido">
                        <select
                          value={form.sentido}
                          onChange={e => setForm(p => ({ ...p, sentido: e.target.value }))}
                          className="w-full bg-[#1C1F26] border border-[#2d3039] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                        >
                          <option value="IDA">Ida</option>
                          <option value="VUELTA">Vuelta</option>
                          <option value="IDA_Y_VUELTA">Ida y Vuelta</option>
                        </select>
                      </Field>
                    </>
                  )}

                  {form.tipo === 'TRASLADO' && (
                    <>
                      <Field label="Destino *">
                        <input
                          type="text"
                          required
                          value={form.destino}
                          onChange={e => setForm(p => ({ ...p, destino: e.target.value }))}
                          placeholder="Concepción, Tribunal de Lebu…"
                          className="w-full bg-[#1C1F26] border border-[#2d3039] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 placeholder-zinc-600"
                        />
                      </Field>
                      <Field label="Motivo / comisión (opcional)">
                        <input
                          type="text"
                          value={form.motivo}
                          onChange={e => setForm(p => ({ ...p, motivo: e.target.value }))}
                          placeholder="Audiencia, diligencia…"
                          className="w-full bg-[#1C1F26] border border-[#2d3039] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 placeholder-zinc-600"
                        />
                      </Field>
                      <div className="grid grid-cols-3 gap-2">
                        <Field label={`Km salida`}>
                          <input
                            type="number"
                            min="0"
                            value={form.kmSalida}
                            onChange={e => setForm(p => ({ ...p, kmSalida: e.target.value }))}
                            placeholder={vehiculoActivo.odometroActual.toLocaleString('es-CL')}
                            className="w-full bg-[#1C1F26] border border-[#2d3039] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 placeholder-zinc-600"
                          />
                        </Field>
                        <Field label="Km llegada">
                          <input
                            type="number"
                            min="0"
                            value={form.kmLlegada}
                            onChange={e => setForm(p => ({ ...p, kmLlegada: e.target.value }))}
                            placeholder="—"
                            className="w-full bg-[#1C1F26] border border-[#2d3039] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 placeholder-zinc-600"
                          />
                        </Field>
                        <Field label="Recorridos">
                          <input
                            readOnly
                            value={
                              form.kmSalida && form.kmLlegada
                                ? `${(Number(form.kmLlegada) - Number(form.kmSalida)).toLocaleString('es-CL')} km`
                                : '—'
                            }
                            className="w-full bg-amber-500/10 border border-transparent rounded-lg px-3 py-2 text-sm text-amber-400 cursor-default"
                          />
                        </Field>
                      </div>
                    </>
                  )}

                  {form.tipo === 'MANTENCION' && (
                    <>
                      <Field label="Tipo de mantención *">
                        <input
                          type="text"
                          required
                          value={form.tipoMantencion}
                          onChange={e => setForm(p => ({ ...p, tipoMantencion: e.target.value }))}
                          placeholder="Aceite, frenos, revisión general…"
                          className="w-full bg-[#1C1F26] border border-[#2d3039] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 placeholder-zinc-600"
                        />
                      </Field>
                      <Field label="Taller (opcional)">
                        <input
                          type="text"
                          value={form.taller}
                          onChange={e => setForm(p => ({ ...p, taller: e.target.value }))}
                          placeholder="Nombre o dirección"
                          className="w-full bg-[#1C1F26] border border-[#2d3039] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 placeholder-zinc-600"
                        />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Costo ($)">
                          <input
                            type="number"
                            min="0"
                            value={form.costo}
                            onChange={e => setForm(p => ({ ...p, costo: e.target.value }))}
                            placeholder="0"
                            className="w-full bg-[#1C1F26] border border-[#2d3039] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 placeholder-zinc-600"
                          />
                        </Field>
                        <Field label="N° folio (opcional)">
                          <input
                            type="text"
                            value={form.numeroFolio}
                            onChange={e => setForm(p => ({ ...p, numeroFolio: e.target.value }))}
                            placeholder="Boleta o factura"
                            className="w-full bg-[#1C1F26] border border-[#2d3039] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 placeholder-zinc-600"
                          />
                        </Field>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Próx. mantención (fecha)">
                          <input
                            type="date"
                            value={form.proxFecha}
                            onChange={e => setForm(p => ({ ...p, proxFecha: e.target.value }))}
                            className="w-full bg-[#1C1F26] border border-[#2d3039] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                          />
                        </Field>
                        <Field label="Próx. mantención (km)">
                          <input
                            type="number"
                            min="0"
                            value={form.proxKm}
                            onChange={e => setForm(p => ({ ...p, proxKm: e.target.value }))}
                            placeholder="Ej: 55000"
                            className="w-full bg-[#1C1F26] border border-[#2d3039] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 placeholder-zinc-600"
                          />
                        </Field>
                      </div>
                    </>
                  )}

                  {/* Notas */}
                  <Field label="Notas (opcional)">
                    <textarea
                      value={form.notas}
                      onChange={e => setForm(p => ({ ...p, notas: e.target.value }))}
                      rows={2}
                      placeholder="Observaciones adicionales…"
                      className="w-full bg-[#1C1F26] border border-[#2d3039] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 placeholder-zinc-600 resize-none"
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={enviando}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {enviando ? 'Registrando…' : 'Registrar actividad'}
                  </button>
                </form>
              </section>
            )}

            {/* ——— Mis Reportes ——————————————————————— */}
          <section className="bg-[#22252e] rounded-2xl border border-[#2d3039] overflow-hidden">
            <button
              onClick={toggleReportes}
              className="w-full px-4 py-3 flex items-center gap-2 text-left hover:bg-[#2b2d35] transition-colors"
            >
              <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path d="M18 20V10M12 20V4M6 20v-6" />
              </svg>
              <span className="text-sm font-semibold flex-1">Mis Reportes</span>
              <svg className={`w-4 h-4 text-zinc-500 transition-transform ${verReportes ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {verReportes && (
              <div className="border-t border-[#2d3039]">
                {/* Selector de año */}
                <div className="px-4 py-3 flex items-center gap-2 border-b border-[#2d3039]">
                  <span className="text-xs text-zinc-500 flex-1">Año</span>
                  <div className="flex gap-1">
                    {[new Date().getFullYear() - 1, new Date().getFullYear()].map(a => (
                      <button
                        key={a}
                        onClick={() => cambiarAnio(a)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all
                          ${anioReporte === a
                            ? 'bg-amber-500 text-black'
                            : 'text-zinc-400 hover:text-white bg-[#1C1F26]'}`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                {loadingRep && (
                  <div className="px-4 py-6 text-center text-xs text-zinc-500">Cargando…</div>
                )}

                {!loadingRep && reporteData && (
                  <>
                    {/* Chips resumen */}
                    <div className="grid grid-cols-2 gap-2 px-4 py-3 border-b border-[#2d3039]">
                      {[
                        { label: 'Km recorridos', value: `${reporteData.totales.kmRecorridos.toLocaleString('es-CL')} km` },
                        { label: 'Combustible', value: `$${reporteData.totales.montoCombustible.toLocaleString('es-CL')}` },
                        { label: 'Peajes', value: `$${reporteData.totales.montoPeajes.toLocaleString('es-CL')}` },
                        { label: 'Actividades', value: reporteData.totales.nActividades },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-[#1C1F26] rounded-xl px-3 py-2.5">
                          <div className="text-[11px] text-zinc-500">{label}</div>
                          <div className="text-sm font-bold text-white mt-0.5">{value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Tabla mensual compacta */}
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[380px] text-xs">
                        <thead>
                          <tr className="border-b border-[#2d3039]">
                            <th className="text-left px-4 py-2 text-zinc-500 font-semibold">Mes</th>
                            <th className="text-right px-3 py-2 text-zinc-500 font-semibold whitespace-nowrap">Km</th>
                            <th className="text-right px-3 py-2 text-zinc-500 font-semibold whitespace-nowrap">Comb.</th>
                            <th className="text-right px-3 py-2 text-zinc-500 font-semibold whitespace-nowrap">Peajes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1C1F26]">
                          {reporteData.meses.map(m => (
                            <tr key={m.mesNum} className={m.nActividades === 0 ? 'opacity-30' : ''}>
                              <td className="px-4 py-2 font-semibold text-zinc-300">{m.mes}</td>
                              <td className="px-3 py-2 text-right tabular-nums text-zinc-400">
                                {m.kmRecorridos > 0 ? `${m.kmRecorridos.toLocaleString('es-CL')}` : '—'}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums text-zinc-400">
                                {m.montoCombustible > 0 ? `$${m.montoCombustible.toLocaleString('es-CL')}` : '—'}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums text-zinc-400">
                                {m.montoPeajes > 0 ? `$${m.montoPeajes.toLocaleString('es-CL')}` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {!loadingRep && !reporteData && (
                  <div className="px-4 py-6 text-center text-xs text-zinc-500">
                    No hay datos disponibles
                  </div>
                )}
              </div>
            )}
          </section>
          </>
        )}
      </main>

      {/* Modal visor PDF */}
      {pdfModal && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/90"
          onClick={() => { URL.revokeObjectURL(pdfModal.dataUrl); setPdfModal(null) }}
        >
          <div className="flex items-center justify-between px-4 py-3 bg-[#1C1F26] border-b border-[#2d3039] flex-shrink-0" onClick={e => e.stopPropagation()}>
            <span className="text-sm font-semibold text-white truncate">{pdfModal.nombre}</span>
            <button onClick={() => { URL.revokeObjectURL(pdfModal.dataUrl); setPdfModal(null) }} className="text-zinc-400 hover:text-white p-1 ml-3 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <iframe
            src={pdfModal.dataUrl}
            className="flex-1 w-full"
            title={pdfModal.nombre}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
