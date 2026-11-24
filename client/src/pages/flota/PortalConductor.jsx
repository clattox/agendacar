// pages/flota/PortalConductor.jsx
// Vista exclusiva del conductor: su vehículo, documentos y registro de actividad
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearSession, estaAutenticado, getUsuario } from '../../lib/auth'
import api from '../../lib/api'

const CLP = v => v.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
const NUM = v => v.toLocaleString('es-CL')

const MESES_NOMBRE = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

function exportarPDFPortal({ titulo, chips, meses, totales, mostrarTotales }) {
  const filas = meses.map(m => {
    const totalGasto = m.montoCombustible + m.montoPeajes
    return `
      <tr style="opacity:${m.nActividades === 0 ? 0.4 : 1}">
        <td>${m.mes}</td>
        <td class="num">${m.kmRecorridos > 0 ? `${NUM(m.kmRecorridos)} km` : '—'}</td>
        <td class="num">${m.montoCombustible > 0 ? CLP(m.montoCombustible) : '—'}</td>
        <td class="num">${m.montoPeajes > 0 ? CLP(m.montoPeajes) : '—'}</td>
        <td class="num bold">${totalGasto > 0 ? CLP(totalGasto) : '—'}</td>
        <td class="num">${m.nActividades > 0 ? m.nActividades : '—'}</td>
      </tr>`
  }).join('')

  const filaTotales = mostrarTotales && totales ? `
    <tfoot><tr class="total-row">
      <td>Total</td>
      <td class="num">${totales.kmRecorridos > 0 ? `${NUM(totales.kmRecorridos)} km` : '—'}</td>
      <td class="num">${totales.montoCombustible > 0 ? CLP(totales.montoCombustible) : '—'}</td>
      <td class="num">${totales.montoPeajes > 0 ? CLP(totales.montoPeajes) : '—'}</td>
      <td class="num amber">${(totales.montoCombustible + totales.montoPeajes) > 0 ? CLP(totales.montoCombustible + totales.montoPeajes) : '—'}</td>
      <td class="num">${totales.nActividades > 0 ? totales.nActividades : '—'}</td>
    </tr></tfoot>` : ''

  const chipsHtml = chips.map(c => `
    <div class="chip">
      <div class="chip-label">${c.label}</div>
      <div class="chip-value">${c.value}</div>
      ${c.sub ? `<div class="chip-sub">${c.sub}</div>` : ''}
    </div>`).join('')

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>${titulo}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,Arial,sans-serif;font-size:12px;color:#111;padding:32px}
  h1{font-size:18px;font-weight:700;margin-bottom:2px}
  .subtitle{font-size:11px;color:#666;margin-bottom:20px}
  .chips{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap}
  .chip{border:1px solid #e5e7eb;border-radius:10px;padding:10px 14px;min-width:120px}
  .chip-label{font-size:10px;color:#6b7280;font-weight:500;text-transform:uppercase;letter-spacing:.03em}
  .chip-value{font-size:16px;font-weight:700;margin:2px 0 1px}
  .chip-sub{font-size:10px;color:#9ca3af}
  h2{font-size:13px;font-weight:600;margin-bottom:8px;display:flex;align-items:center;gap:6px}
  h2::before{content:'';display:inline-block;width:12px;height:12px;background:#f59e0b;border-radius:2px}
  table{width:100%;border-collapse:collapse;font-size:11px}
  th{text-align:left;padding:7px 10px;font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;border-bottom:2px solid #e5e7eb;background:#f9fafb}
  td{padding:7px 10px;border-bottom:1px solid #f3f4f6}
  .num{text-align:right;font-variant-numeric:tabular-nums}
  .bold{font-weight:600}
  tfoot .total-row td{font-weight:700;border-top:2px solid #d1d5db;border-bottom:none;background:#f9fafb}
  .amber{color:#d97706}
  .footer{margin-top:24px;font-size:10px;color:#9ca3af;text-align:right}
</style></head>
<body>
  <h1>${titulo}</h1>
  <div class="subtitle">Generado el ${new Date().toLocaleDateString('es-CL',{day:'2-digit',month:'long',year:'numeric'})}</div>
  <div class="chips">${chipsHtml}</div>
  <h2>Detalle</h2>
  <table>
    <thead><tr>
      <th>Mes</th>
      <th style="text-align:right">Km recorridos</th>
      <th style="text-align:right">Combustible</th>
      <th style="text-align:right">Peajes</th>
      <th style="text-align:right">Total gastos</th>
      <th style="text-align:right">Actividades</th>
    </tr></thead>
    <tbody>${filas}</tbody>
    ${filaTotales}
  </table>
  <div class="footer">AgendaCar · Reporte de flota</div>
</body></html>`

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  win.onload = () => { win.focus(); win.print() }
}

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
  const [verAnioPortal, setVerAnioPortal] = useState(false)  // false = mensual (default), true = anual
  const [mesMostrado,   setMesMostrado]   = useState(new Date().getMonth() + 1) // 1-indexed

  // Form actividad
  const [form,    setForm]    = useState({
    tipo:            'COMBUSTIBLE',
    fecha:           new Date().toISOString().slice(0, 10),
    notas:           '',
    odometroActual:  '',
    tipoCombustible: 'BENCINA_95',
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

  // Modal registrar llegada
  const [modalLlegada,   setModalLlegada]   = useState(null)  // { actId, kmSalida, destino }
  const [kmLlegadaInput, setKmLlegadaInput] = useState('')
  const [savingLlegada,  setSavingLlegada]  = useState(false)
  const [errorLlegada,   setErrorLlegada]   = useState('')

  // Actividades recientes (para mostrar traslados en curso)
  const [actRecientes,    setActRecientes]    = useState([])
  const [loadingActRec,   setLoadingActRec]   = useState(false)

  // Modal editar traslado
  const [modalEditTraslado,  setModalEditTraslado]  = useState(null) // { actId, destino, motivo, kmSalida, kmLlegada, fecha }
  const [savingEditTraslado, setSavingEditTraslado] = useState(false)
  const [errorEditTraslado,  setErrorEditTraslado]  = useState('')
  // pdfModal eliminado — documentos se abren en nueva pestaña

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
    cargarActRecientes(vehiculoActivo?.id)
  }, [vehiculoActivo?.id, cargarActRecientes])

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
      // Combinar la fecha elegida con la hora actual local para evitar desfase UTC
      const ahora = new Date()
      const [anio, mes, dia] = form.fecha.split('-').map(Number)
      const fechaConHora = new Date(anio, mes - 1, dia, ahora.getHours(), ahora.getMinutes(), ahora.getSeconds())

      await api.post('/flota/portal/actividad', {
        ...form,
        fecha:          fechaConHora.toISOString(),
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

  const cargarActRecientes = useCallback(async (vid) => {
    if (!vid) return
    setLoadingActRec(true)
    try {
      const res = await api.get(`/flota/portal/actividades-recientes?vehiculoId=${vid}`)
      setActRecientes(res.data)
    } catch {
      setActRecientes([])
    } finally {
      setLoadingActRec(false)
    }
  }, [])

  async function completarLlegada() {
    const km = Number(kmLlegadaInput)
    if (!km || km <= 0) return setErrorLlegada('Ingresa un km válido')
    if (modalLlegada.kmSalida && km <= modalLlegada.kmSalida) {
      return setErrorLlegada(`Debe ser mayor al km de salida (${modalLlegada.kmSalida.toLocaleString('es-CL')} km)`)
    }
    setSavingLlegada(true)
    setErrorLlegada('')
    try {
      await api.patch(`/flota/portal/actividad/${modalLlegada.actId}/llegada`, { kmLlegada: km })
      setModalLlegada(null)
      cargar(true)
      cargarActRecientes(vehiculoActivo?.id)
    } catch (e) {
      setErrorLlegada(e.response?.data?.error || 'Error al registrar')
    } finally {
      setSavingLlegada(false)
    }
  }

  async function guardarEditTraslado() {
    if (!modalEditTraslado.destino?.trim()) return setErrorEditTraslado('El destino es obligatorio')
    const kmS = modalEditTraslado.kmSalida  ? Number(modalEditTraslado.kmSalida)  : null
    const kmL = modalEditTraslado.kmLlegada ? Number(modalEditTraslado.kmLlegada) : null
    if (kmS && kmL && kmL <= kmS) return setErrorEditTraslado('Km llegada debe ser mayor al de salida')
    setSavingEditTraslado(true)
    setErrorEditTraslado('')
    try {
      await api.patch(`/flota/portal/actividad/${modalEditTraslado.actId}/traslado`, {
        destino:   modalEditTraslado.destino.trim(),
        motivo:    modalEditTraslado.motivo?.trim() || null,
        kmSalida:  kmS,
        kmLlegada: kmL,
        fecha:     modalEditTraslado.fecha || undefined,
      })
      setModalEditTraslado(null)
      cargar(true)
      cargarActRecientes(vehiculoActivo?.id)
    } catch (e) {
      setErrorEditTraslado(e.response?.data?.error || 'Error al guardar')
    } finally {
      setSavingEditTraslado(false)
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

            {/* ——— Traslados en curso ——————————————————— */}
            {vehiculoActivo && actRecientes.some(a => a.tipo === 'TRASLADO' && a.trasladoRegistro?.kmSalida != null && a.trasladoRegistro?.kmLlegada == null) && (
              <section className="bg-[#22252e] rounded-2xl border border-amber-500/40 overflow-hidden">
                <div className="px-4 py-3 border-b border-amber-500/20 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-sm font-semibold text-amber-400">Traslado en curso</span>
                </div>
                <div className="divide-y divide-[#2d3039]">
                  {actRecientes
                    .filter(a => a.tipo === 'TRASLADO' && a.trasladoRegistro?.kmSalida != null && a.trasladoRegistro?.kmLlegada == null)
                    .map(act => (
                      <div key={act.id} className="px-4 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white truncate">
                            → {act.trasladoRegistro.destino}
                          </div>
                          <div className="text-xs text-zinc-400 mt-0.5">
                            Salida: {act.trasladoRegistro.kmSalida.toLocaleString('es-CL')} km
                            {act.trasladoRegistro.motivo && ` · ${act.trasladoRegistro.motivo}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setModalEditTraslado({
                              actId:     act.id,
                              destino:   act.trasladoRegistro.destino  || '',
                              motivo:    act.trasladoRegistro.motivo   || '',
                              kmSalida:  act.trasladoRegistro.kmSalida != null ? String(act.trasladoRegistro.kmSalida) : '',
                              kmLlegada: '',
                              fecha:     act.fecha ? act.fecha.slice(0, 10) : new Date().toISOString().slice(0, 10),
                            })}
                            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#3d4049] text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors whitespace-nowrap"
                            title="Editar traslado"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar
                          </button>
                          <button
                            onClick={() => { setModalLlegada({ actId: act.id, kmSalida: act.trasladoRegistro.kmSalida, destino: act.trasladoRegistro.destino }); setKmLlegadaInput(''); setErrorLlegada('') }}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-colors whitespace-nowrap"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Registrar llegada
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            )}

            {/* ——— Traslados recientes (completados, editables) ——— */}
            {vehiculoActivo && (() => {
              const trasladosRecientes = actRecientes.filter(a =>
                a.tipo === 'TRASLADO' && a.trasladoRegistro?.kmLlegada != null
              )
              if (trasladosRecientes.length === 0) return null
              return (
                <section className="bg-[#22252e] rounded-2xl border border-[#2d3039] overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#2d3039] flex items-center gap-2">
                    <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span className="text-sm font-semibold text-zinc-300">Traslados recientes</span>
                    <span className="ml-auto text-xs text-zinc-500">{trasladosRecientes.length} registros</span>
                  </div>
                  <div className="divide-y divide-[#2d3039]">
                    {trasladosRecientes.map(act => {
                      const tr = act.trasladoRegistro
                      const km = tr.kmSalida != null && tr.kmLlegada != null ? tr.kmLlegada - tr.kmSalida : null
                      const fechaStr = new Date(act.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
                      return (
                        <div key={act.id} className="px-4 py-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm text-white truncate">→ {tr.destino}</div>
                            <div className="text-xs text-zinc-500 mt-0.5">
                              {fechaStr}{km ? ` · ${km.toLocaleString('es-CL')} km` : ''}{tr.motivo ? ` · ${tr.motivo}` : ''}
                            </div>
                          </div>
                          <button
                            onClick={() => setModalEditTraslado({
                              actId:     act.id,
                              destino:   tr.destino   || '',
                              motivo:    tr.motivo    || '',
                              kmSalida:  tr.kmSalida  != null ? String(tr.kmSalida)  : '',
                              kmLlegada: tr.kmLlegada != null ? String(tr.kmLlegada) : '',
                              fecha:     act.fecha ? act.fecha.slice(0, 10) : new Date().toISOString().slice(0, 10),
                            })}
                            className="shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#3d4049] text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors whitespace-nowrap"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            })()}

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
                        { v: 'COMBUSTIBLE', label: 'Combustible'},
                        { v: 'TRASLADO',    label: 'Traslado'   },
                        { v: 'KILOMETRAJE', label: 'Kilometraje'},
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

            {/* ——— Documentos del vehículo ————————————— */}
            {vehiculoActivo && (
              <section className="bg-[#22252e] rounded-2xl border border-[#2d3039] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#2d3039] flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-semibold">Documentos</span>
                </div>
                <div className="px-4 py-3">
                  {vehiculoActivo.documentos?.length > 0 ? (
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
                                    const b64 = doc.archivoBase64.startsWith('data:')
                                      ? doc.archivoBase64.split(',')[1]
                                      : doc.archivoBase64
                                    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
                                    const blob = new Blob([bytes], { type: 'application/pdf' })
                                    const url = URL.createObjectURL(blob)
                                    window.open(url, '_blank')
                                    setTimeout(() => URL.revokeObjectURL(url), 10000)
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
                  ) : (
                    <div className="text-xs text-zinc-500 text-center py-2">Sin documentos registrados</div>
                  )}
                </div>
              </section>
            )}

            {/* ——— Mis Reportes ——————————————————————— */}
          <section className="bg-[#22252e] rounded-2xl border border-[#2d3039] overflow-hidden">
            <div className="flex items-center">
              <button
                onClick={toggleReportes}
                className="flex-1 px-4 py-3 flex items-center gap-2 text-left hover:bg-[#2b2d35] transition-colors"
              >
                <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path d="M18 20V10M12 20V4M6 20v-6" />
                </svg>
                <span className="text-sm font-semibold flex-1">Mis Reportes</span>
                <svg className={`w-4 h-4 text-zinc-500 transition-transform ${verReportes ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {verReportes && (
              <div className="border-t border-[#2d3039]">
                {/* Controles: año + mes/anual + exportar */}
                <div className="px-4 py-3 flex flex-wrap items-center gap-2 border-b border-[#2d3039]">
                  {/* Selector año */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-500 mb-0.5">Año</span>
                    <select
                      value={anioReporte}
                      onChange={e => cambiarAnio(Number(e.target.value))}
                      className="bg-[#1C1F26] border border-[#2d3039] text-xs text-zinc-300 rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500"
                    >
                      {Array.from({ length: 2030 - 2024 + 1 }, (_, i) => 2030 - i).map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                  {/* Toggle mensual/anual */}
                  {reporteData && (
                    <button
                      onClick={() => setVerAnioPortal(v => !v)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border self-end mb-0.5
                        ${verAnioPortal
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                          : 'border-[#2d3039] text-zinc-400 hover:text-white'}`}
                    >
                      {verAnioPortal ? 'Ver mes' : 'Ver año'}
                    </button>
                  )}
                  {/* Selector mes (solo vista mensual) */}
                  {reporteData && !verAnioPortal && (
                    <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-500 mb-0.5">Mes</span>
                      <select
                        value={mesMostrado}
                        onChange={e => setMesMostrado(Number(e.target.value))}
                        className="bg-[#1C1F26] border border-[#2d3039] text-xs text-zinc-300 rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500"
                      >
                        {MESES_NOMBRE.map((m, i) => (
                          <option key={i + 1} value={i + 1}>{m}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {/* Exportar PDF */}
                  {reporteData && reporteData.totales.nActividades > 0 && (
                    <button
                      onClick={() => {
                        const mesFiltrado = !verAnioPortal
                          ? reporteData.meses.find(m => m.mesNum === mesMostrado)
                          : null
                        const esAnual = verAnioPortal || !mesFiltrado

                        exportarPDFPortal(esAnual ? {
                          titulo: `Reporte anual ${anioReporte}`,
                          chips: [
                            { label: 'Km recorridos', value: `${NUM(reporteData.totales.kmRecorridos)} km`, sub: `Año ${anioReporte}` },
                            { label: 'Combustible',   value: CLP(reporteData.totales.montoCombustible) },
                            { label: 'Peajes',        value: CLP(reporteData.totales.montoPeajes) },
                            { label: 'Actividades',   value: NUM(reporteData.totales.nActividades) },
                          ],
                          meses: reporteData.meses,
                          totales: reporteData.totales,
                          mostrarTotales: true,
                        } : {
                          titulo: `Reporte ${MESES_NOMBRE[mesFiltrado.mesNum - 1]} ${anioReporte}`,
                          chips: [
                            { label: 'Km recorridos', value: `${NUM(mesFiltrado.kmRecorridos)} km`, sub: 'En el mes' },
                            { label: 'Combustible',   value: CLP(mesFiltrado.montoCombustible) },
                            { label: 'Peajes',        value: CLP(mesFiltrado.montoPeajes) },
                            { label: 'Actividades',   value: NUM(mesFiltrado.nActividades) },
                          ],
                          meses: [mesFiltrado],
                          mostrarTotales: false,
                        })
                      }}
                      className="ml-auto flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold border border-[#2d3039] text-zinc-400 hover:text-white hover:bg-[#2b2d35] transition-colors whitespace-nowrap"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a1 1 0 001 1h16a1 1 0 001-1v-3" />
                      </svg>
                      PDF
                    </button>
                  )}
                </div>

                {loadingRep && (
                  <div className="px-4 py-6 text-center text-xs text-zinc-500">Cargando…</div>
                )}

                {!loadingRep && reporteData && (() => {
                  const mesDato = reporteData.meses.find(m => m.mesNum === mesMostrado)
                  const chips = verAnioPortal ? [
                    { label: 'Km recorridos', value: `${NUM(reporteData.totales.kmRecorridos)} km` },
                    { label: 'Combustible',   value: CLP(reporteData.totales.montoCombustible) },
                    { label: 'Peajes',        value: CLP(reporteData.totales.montoPeajes) },
                    { label: 'Actividades',   value: NUM(reporteData.totales.nActividades) },
                  ] : mesDato ? [
                    { label: 'Km recorridos', value: `${NUM(mesDato.kmRecorridos)} km` },
                    { label: 'Combustible',   value: CLP(mesDato.montoCombustible) },
                    { label: 'Peajes',        value: CLP(mesDato.montoPeajes) },
                    { label: 'Actividades',   value: NUM(mesDato.nActividades) },
                  ] : null
                  const filas = verAnioPortal ? reporteData.meses : (mesDato ? [mesDato] : [])

                  return (
                    <>
                      {/* Chips resumen */}
                      {chips && (
                        <div className="grid grid-cols-2 gap-2 px-4 py-3 border-b border-[#2d3039]">
                          {chips.map(({ label, value }) => (
                            <div key={label} className="bg-[#1C1F26] rounded-xl px-3 py-2.5">
                              <div className="text-[11px] text-zinc-500">{label}</div>
                              <div className="text-sm font-bold text-white mt-0.5">{value}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Tabla */}
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[320px] text-xs">
                          <thead>
                            <tr className="border-b border-[#2d3039]">
                              <th className="text-left px-4 py-2 text-zinc-500 font-semibold">Mes</th>
                              <th className="text-right px-3 py-2 text-zinc-500 font-semibold whitespace-nowrap">Km</th>
                              <th className="text-right px-3 py-2 text-zinc-500 font-semibold whitespace-nowrap">Comb.</th>
                              <th className="text-right px-3 py-2 text-zinc-500 font-semibold whitespace-nowrap">Peajes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1C1F26]">
                            {filas.map(m => (
                              <tr key={m.mesNum} className={m.nActividades === 0 ? 'opacity-30' : ''}>
                                <td className="px-4 py-2 font-semibold text-zinc-300">{m.mes}</td>
                                <td className="px-3 py-2 text-right tabular-nums text-zinc-400">
                                  {m.kmRecorridos > 0 ? `${NUM(m.kmRecorridos)} km` : '—'}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums text-zinc-400">
                                  {m.montoCombustible > 0 ? CLP(m.montoCombustible) : '—'}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums text-zinc-400">
                                  {m.montoPeajes > 0 ? CLP(m.montoPeajes) : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          {verAnioPortal && (
                            <tfoot>
                              <tr className="border-t border-[#2d3039]">
                                <td className="px-4 py-2 text-xs font-bold text-zinc-500">Total</td>
                                <td className="px-3 py-2 text-right tabular-nums font-bold text-zinc-300">
                                  {reporteData.totales.kmRecorridos > 0 ? `${NUM(reporteData.totales.kmRecorridos)} km` : '—'}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums font-bold text-zinc-300">
                                  {reporteData.totales.montoCombustible > 0 ? CLP(reporteData.totales.montoCombustible) : '—'}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums font-bold text-amber-400">
                                  {reporteData.totales.montoPeajes > 0 ? CLP(reporteData.totales.montoPeajes) : '—'}
                                </td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    </>
                  )
                })()}

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

      {/* Documentos se abren en nueva pestaña — sin modal */}

      {/* ——— Modal registrar llegada ————————————————————— */}
      {modalLlegada && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4 pb-4 sm:pb-0">
          <div className="bg-[#22252e] border border-[#2d3039] rounded-2xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-bold text-white">Registrar llegada</div>
                <div className="text-xs text-zinc-400 mt-0.5 truncate">{modalLlegada.destino}</div>
              </div>
              <button onClick={() => setModalLlegada(null)} className="text-zinc-500 hover:text-white p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {modalLlegada.kmSalida != null && (
              <div className="text-xs text-zinc-500 mb-3">Salida: {modalLlegada.kmSalida.toLocaleString('es-CL')} km</div>
            )}
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Odómetro de llegada (km)</label>
            <input
              type="number"
              className="w-full bg-[#1C1F26] border border-[#3d4049] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 mb-3"
              value={kmLlegadaInput}
              onChange={e => { setKmLlegadaInput(e.target.value); setErrorLlegada('') }}
              placeholder={modalLlegada.kmSalida ? `Mayor a ${modalLlegada.kmSalida.toLocaleString('es-CL')}` : 'Ej: 197500'}
              autoFocus
            />
            {errorLlegada && <p className="text-xs text-red-400 mb-3">{errorLlegada}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setModalLlegada(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#3d4049] text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={completarLlegada}
                disabled={savingLlegada || !kmLlegadaInput}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-bold hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {savingLlegada ? 'Guardando…' : 'Confirmar llegada'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ——— Modal editar traslado ————————————————————— */}
      {modalEditTraslado && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4 pb-4 sm:pb-0">
          <div className="bg-[#22252e] border border-[#2d3039] rounded-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold">Editar traslado</div>
                <div className="text-xs text-zinc-500 mt-0.5">Modifica los datos del traslado</div>
              </div>
              <button onClick={() => setModalEditTraslado(null)} className="text-zinc-500 hover:text-white p-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {/* Fecha */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Fecha</label>
                <input
                  type="date"
                  value={modalEditTraslado.fecha}
                  onChange={e => setModalEditTraslado(p => ({ ...p, fecha: e.target.value }))}
                  className="w-full bg-[#1C1F26] border border-[#2d3039] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>
              {/* Destino */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Destino <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={modalEditTraslado.destino}
                  onChange={e => setModalEditTraslado(p => ({ ...p, destino: e.target.value }))}
                  placeholder="Ciudad, dirección o referencia"
                  className="w-full bg-[#1C1F26] border border-[#2d3039] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 placeholder-zinc-600"
                />
              </div>
              {/* Motivo */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Motivo</label>
                <input
                  type="text"
                  value={modalEditTraslado.motivo}
                  onChange={e => setModalEditTraslado(p => ({ ...p, motivo: e.target.value }))}
                  placeholder="Ej: Entrega de mercadería"
                  className="w-full bg-[#1C1F26] border border-[#2d3039] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 placeholder-zinc-600"
                />
              </div>
              {/* Km salida / llegada */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Km salida</label>
                  <input
                    type="number"
                    min="0"
                    value={modalEditTraslado.kmSalida}
                    onChange={e => setModalEditTraslado(p => ({ ...p, kmSalida: e.target.value }))}
                    placeholder="Ej: 195000"
                    className="w-full bg-[#1C1F26] border border-[#2d3039] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 placeholder-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Km llegada</label>
                  <input
                    type="number"
                    min="0"
                    value={modalEditTraslado.kmLlegada}
                    onChange={e => setModalEditTraslado(p => ({ ...p, kmLlegada: e.target.value }))}
                    placeholder="Dejar vacío si en curso"
                    className="w-full bg-[#1C1F26] border border-[#2d3039] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 placeholder-zinc-600"
                  />
                </div>
              </div>
            </div>

            {errorEditTraslado && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {errorEditTraslado}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setModalEditTraslado(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#3d4049] text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardarEditTraslado}
                disabled={savingEditTraslado || !modalEditTraslado.destino?.trim()}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-bold hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {savingEditTraslado ? 'Guardando…' : 'Guardar cambios'}
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
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
