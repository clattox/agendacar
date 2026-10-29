import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Car,
  CheckCircle2,
  ClipboardList,
  Loader2,
  MapPin,
  Pencil,
  Printer,
  Save,
  Trash2,
  User,
  X
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { Alert, Button, Input } from '../../components/ui'
import { getInspeccion, guardarInspeccion, confirmarInspeccion } from '../../services/inspeccionService'
import { listarTrabajadores } from '../../services/trabajadorService'
import { formatFullDate, formatTimeFromISO } from '../../lib/dates'
import { getUsuario } from '../../lib/auth'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { SVG_LATERAL, SVG_FRONTAL, SVG_TRASERA, SVG_SUPERIOR } from './InspeccionSVGs'

// ── Tipos de daño ────────────────────────────────────────────────────────────
const TIPOS_DANO = [
  { value: 'rayon',       label: 'Raya / rayón',  color: '#F47732' },
  { value: 'abolladura',  label: 'Abolladura',    color: '#EF4444' },
  { value: 'piquete',     label: 'Piquete',       color: '#3B82F6' },
  { value: 'otro',        label: 'Otro daño',     color: '#6B7280' }
]

const VISTAS = [
  { value: 'lateral',   label: 'Vista lateral' },
  { value: 'frontal',   label: 'Vista frontal' },
  { value: 'trasera',   label: 'Vista trasera' },
  { value: 'superior',  label: 'Vista superior' }
]

// ── SVGs del vehículo ────────────────────────────────────────────────────────
const SVG_MAP = {
  lateral:  SVG_LATERAL,
  frontal:  SVG_FRONTAL,
  trasera:  SVG_TRASERA,
  superior: SVG_SUPERIOR
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function Inspeccion() {
  const { reservaId } = useParams()
  const navigate = useNavigate()
  useDocumentTitle('Inspección previa')

  const svgRef = useRef(null)
  const usuario = getUsuario()

  const [loading, setLoading]         = useState(true)
  const [guardando, setGuardando]     = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError]             = useState('')
  const [exito, setExito]             = useState('')

  const [reserva, setReserva]           = useState(null)
  const [inspeccion, setInspeccion]     = useState(null)
  const [trabajadores, setTrabajadores] = useState([])

  // Estado del formulario
  const [vistaActiva, setVistaActiva]         = useState('lateral')
  const [tipoActivo, setTipoActivo]           = useState('rayon')
  const [danos, setDanos]                     = useState([])
  const [observaciones, setObservaciones]     = useState('')
  const [trabajadorId, setTrabajadorId]       = useState('')
  const [editandoIdx, setEditandoIdx]         = useState(null)
  const [danoForm, setDanoForm]             = useState({ ubicacion: '', descripcion: '' })
  const [clienteConfirmo, setClienteConfirmo] = useState(false)

  // Carga inicial
  useEffect(() => {
    const cargar = async () => {
      try {
        const [{ reserva: r, inspeccion: ins }, trabs] = await Promise.all([
          getInspeccion(reservaId),
          listarTrabajadores().catch(() => [])
        ])
        setReserva(r)
        setTrabajadores(trabs.filter(t => t.activo))
        if (ins) {
          setInspeccion(ins)
          setDanos(ins.danos || [])
          setObservaciones(ins.observaciones || '')
          setTrabajadorId(ins.trabajadorId ? String(ins.trabajadorId) : '')
          setClienteConfirmo(ins.clienteConfirmo || false)
        }
      } catch (e) {
        setError(e?.message || 'No se pudo cargar la información de la reserva.')
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [reservaId])

  // Agregar daño al hacer clic en el SVG
  const handleSvgClick = useCallback((e) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const posX = ((e.clientX - rect.left) / rect.width) * 100
    const posY = ((e.clientY - rect.top) / rect.height) * 100
    const nuevo = {
      tipo: tipoActivo,
      vista: vistaActiva,
      posX: Math.round(posX * 10) / 10,
      posY: Math.round(posY * 10) / 10,
      ubicacion: '',
      descripcion: '',
      _tempId: Date.now()
    }
    setDanos(prev => [...prev, nuevo])
    // Abrir el form de descripción para el nuevo daño
    setEditandoIdx(danos.length)
    setDanoForm({ ubicacion: '', descripcion: '' })
  }, [tipoActivo, vistaActiva, danos.length])

  const eliminarDano = (idx) => {
    setDanos(prev => prev.filter((_, i) => i !== idx))
    if (editandoIdx === idx) setEditandoIdx(null)
  }

  const guardarDescripcionDano = () => {
    if (editandoIdx === null) return
    setDanos(prev => prev.map((d, i) =>
      i === editandoIdx ? { ...d, ubicacion: danoForm.ubicacion, descripcion: danoForm.descripcion } : d
    ))
    setEditandoIdx(null)
  }

  const abrirEdicion = (idx) => {
    setEditandoIdx(idx)
    setDanoForm({ ubicacion: danos[idx].ubicacion || '', descripcion: danos[idx].descripcion || '' })
  }

  const danosDeLaVista = danos
    .map((d, i) => ({ ...d, idx: i }))
    .filter(d => d.vista === vistaActiva)

  // Guardar inspección
  const handleGuardar = async () => {
    setGuardando(true)
    setError('')
    try {
      const resultado = await guardarInspeccion(reservaId, {
        observaciones,
        trabajadorId: trabajadorId ? parseInt(trabajadorId) : null,
        danos
      })
      setInspeccion(resultado)
      setExito('Inspección guardada correctamente.')
      setTimeout(() => setExito(''), 3000)
    } catch {
      setError('Error al guardar la inspección.')
    } finally {
      setGuardando(false)
    }
  }

  // Confirmar que el cliente revisó
  const handleConfirmar = async () => {
    if (!inspeccion) return
    setConfirmando(true)
    setError('')
    try {
      const resultado = await confirmarInspeccion(reservaId)
      setInspeccion(resultado)
      setClienteConfirmo(true)
      setExito('Confirmación del cliente registrada.')
      setTimeout(() => setExito(''), 3000)
    } catch {
      setError('Error al registrar confirmación.')
    } finally {
      setConfirmando(false)
    }
  }

  const handleImprimir = () => window.print()

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <AdminLayout hideBanner>
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
      </div>
    </AdminLayout>
  )

  if (!reserva) return (
    <AdminLayout hideBanner>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Alert variant="error">{error || 'No se encontró la reserva.'}</Alert>
      </div>
    </AdminLayout>
  )

  const nombreVehiculo = [reserva.vehiculo?.marca, reserva.vehiculo?.modelo, reserva.vehiculo?.anio]
    .filter(Boolean).join(' ') || 'Vehículo sin datos'

  const yaInspeccionado = !!inspeccion

  return (
    <AdminLayout hideBanner>
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6 print:px-0 print:py-0 print:space-y-4">

        {/* Encabezado solo visible al imprimir */}
        <div className="hidden print:flex items-center gap-3 pb-4 border-b border-line mb-2">
          {usuario?.tenant?.logoUrl && (
            <img src={usuario.tenant.logoUrl} alt={usuario.tenant.nombre} className="h-12 w-auto object-contain" />
          )}
          <div>
            <p className="text-lg font-bold text-ink">{usuario?.tenant?.nombre || 'Taller'}</p>
            <p className="text-xs text-ink-muted">Inspección previa del vehículo</p>
          </div>
        </div>

        {/* Cabecera */}
        <div className="print:hidden flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/agenda')}
            className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Agenda
          </button>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-ink flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-accent-600" aria-hidden="true" />
              Inspección previa del vehículo
            </h1>
            <p className="text-sm text-ink-muted mt-0.5">Registra el estado visible del vehículo antes del servicio.</p>
          </div>
          <div className="print:hidden flex gap-2">
            {yaInspeccionado && (
              <Button variant="outline" size="sm" onClick={handleImprimir}>
                <Printer className="h-4 w-4 mr-1.5" />
                Imprimir
              </Button>
            )}
          </div>
        </div>

        {error && <Alert variant="error" onDismiss={() => setError('')}>{error}</Alert>}
        {exito && <Alert variant="success">{exito}</Alert>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Columna izquierda: datos de la reserva ── */}
          <div className="space-y-4">
            <div className="rounded-xl border border-line bg-surface p-4 space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted flex items-center gap-1.5">
                <Car className="h-3.5 w-3.5" />
                Datos de la reserva
                <span className="ml-auto text-accent-600 font-bold">#{reserva.id}</span>
              </h2>
              <dl className="space-y-2 text-sm">
                <div><dt className="text-ink-muted">Cliente</dt><dd className="font-medium text-ink">{reserva.nombre}</dd></div>
                <div><dt className="text-ink-muted">Teléfono</dt><dd className="text-ink">{reserva.telefono}</dd></div>
                <div><dt className="text-ink-muted">Patente</dt><dd className="font-mono font-bold text-ink">{reserva.patente}</dd></div>
                <div><dt className="text-ink-muted">Vehículo</dt><dd className="text-ink">{nombreVehiculo}</dd></div>
                <div><dt className="text-ink-muted">Servicio</dt><dd className="text-ink">{reserva.servicio?.nombre}</dd></div>
                <div><dt className="text-ink-muted">Fecha</dt><dd className="text-ink">{formatFullDate(new Date(reserva.fecha))}</dd></div>
                <div><dt className="text-ink-muted">Hora</dt><dd className="text-ink">{formatTimeFromISO(reserva.fecha)}</dd></div>
              </dl>
            </div>

            {/* Selector de responsable */}
            <div className="rounded-xl border border-line bg-surface p-4 space-y-2 print:hidden">
              <label className="text-xs font-semibold uppercase tracking-wide text-ink-muted flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Responsable de la inspección
              </label>
              {trabajadores.length === 0 ? (
                <p className="text-xs text-ink-muted italic">
                  No hay trabajadores registrados.{' '}
                  <a href="/admin/trabajadores" className="text-accent-600 hover:underline">Agregar uno</a>.
                </p>
              ) : (
                <select
                  value={trabajadorId}
                  onChange={e => setTrabajadorId(e.target.value)}
                  className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent-500"
                >
                  <option value="">Sin asignar</option>
                  {trabajadores.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}{t.cargo ? ` — ${t.cargo}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Estado de inspección */}
            {yaInspeccionado && (
              <div className="rounded-xl border border-line bg-surface p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Estado</h3>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="text-ink">Inspección registrada</span>
                </div>
                {inspeccion?.trabajador && (
                  <p className="text-xs text-ink-muted">
                    Por: {inspeccion.trabajador.nombre}
                    {inspeccion.trabajador.cargo ? ` (${inspeccion.trabajador.cargo})` : ''}
                  </p>
                )}
                {inspeccion?.clienteConfirmo ? (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    Copia entregada al cliente
                  </div>
                ) : (
                  <div className="space-y-2 print:hidden">
                    <label className="flex items-start gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={clienteConfirmo}
                        onChange={e => {
                          setClienteConfirmo(e.target.checked)
                          if (e.target.checked) handleConfirmar()
                        }}
                        className="mt-0.5 h-4 w-4 rounded border-line accent-accent-600"
                      />
                      <span className="text-ink-muted">Se entregó resumen impreso al cliente</span>
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Columna central + derecha: diagrama + daños ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Selector de vistas */}
            <div className="print:hidden flex flex-wrap gap-2">
              {VISTAS.map(v => (
                <button
                  key={v.value}
                  onClick={() => setVistaActiva(v.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                    vistaActiva === v.value
                      ? 'bg-accent-600 text-white border-accent-600'
                      : 'bg-surface text-ink-muted border-line hover:border-accent-400'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {/* Tipos de daño */}
            <div className="print:hidden flex flex-wrap gap-2 items-center">
              <span className="text-xs text-ink-muted">Tipo de marca:</span>
              {TIPOS_DANO.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTipoActivo(t.value)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    tipoActivo === t.value
                      ? 'shadow-sm scale-105 border-transparent text-white'
                      : 'bg-surface border-line text-ink-muted hover:border-gray-300'
                  }`}
                  style={tipoActivo === t.value ? { backgroundColor: t.color } : {}}
                >
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Diagrama SVG */}
            <div className="rounded-xl border border-line bg-surface overflow-visible">
              <div className="px-4 py-2 border-b border-line bg-surface-raised print:hidden rounded-t-xl overflow-hidden">
                <p className="text-xs text-ink-muted">Haz clic sobre el diagrama para marcar un daño visible</p>
              </div>
              {/* Vista de impresión: mostrar las 4 vistas */}
              <div className="hidden print:grid print:grid-cols-2 print:gap-4 print:p-4">
                {VISTAS.map(v => {
                  const danosDeLaVistaImp = danos.filter(d => d.vista === v.value)
                  return (
                    <div key={v.value} className="space-y-1">
                      <p className="text-xs font-semibold text-ink-muted uppercase">{v.label}</p>
                      <div className="relative border border-line rounded-lg overflow-hidden" style={{ aspectRatio: v.value === 'superior' ? '220/380' : '400/200' }}>
                        {SVG_MAP[v.value]}
                        {danosDeLaVistaImp.map((d, i) => {
                          const tipo = TIPOS_DANO.find(t => t.value === d.tipo)
                          return (
                            <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center" style={{ left: `${d.posX}%`, top: `${d.posY}%` }}>
                              <div className="h-5 w-5 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm" style={{ backgroundColor: tipo?.color || '#6B7280', fontSize: '9px' }}>
                                {d.idx !== undefined ? d.idx + 1 : i + 1}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Vista normal: una vista activa */}
              {/* Wrapper de centrado — necesario para superior (−30%) y lateral (+15%) */}
              <div className={`print:hidden${vistaActiva === 'superior' ? ' flex justify-center' : ''}`}>
                <div
                  className="relative cursor-crosshair select-none"
                  style={{
                    aspectRatio: vistaActiva === 'superior' ? '220/380' : '400/200',
                    ...(vistaActiva === 'superior'
                      ? { width: '70%' }
                      : vistaActiva === 'lateral'
                      ? { width: '115%', marginLeft: '-7.5%' }
                      : {})
                  }}
                  ref={svgRef}
                  onClick={handleSvgClick}
                >
                  {SVG_MAP[vistaActiva]}
                  {/* Marcadores de daño */}
                  {danosDeLaVista.map((d, i) => {
                    const tipo = TIPOS_DANO.find(t => t.value === d.tipo)
                    const numeral = danos.filter(x => x.vista === vistaActiva).indexOf(d) + 1
                    return (
                      <div
                        key={d._tempId || d.id || i}
                        className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                        style={{ left: `${d.posX}%`, top: `${d.posY}%` }}
                        onClick={e => { e.stopPropagation(); abrirEdicion(d.idx) }}
                        title={tipo?.label}
                      >
                        <div
                          className="h-6 w-6 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-md"
                          style={{ backgroundColor: tipo?.color || '#6B7280' }}
                        >
                          {numeral}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Modal edición de daño */}
            {editandoIdx !== null && (
              <div className="rounded-xl border border-accent-200 bg-accent-50 p-4 space-y-3 print:hidden">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">
                    Daño #{editandoIdx + 1} — {TIPOS_DANO.find(t => t.value === danos[editandoIdx]?.tipo)?.label}
                  </p>
                  <button onClick={() => setEditandoIdx(null)} className="text-ink-muted hover:text-ink">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-ink-muted mb-1">Zona del vehículo</label>
                    <Input
                      value={danoForm.ubicacion}
                      onChange={e => setDanoForm(f => ({ ...f, ubicacion: e.target.value }))}
                      placeholder="Ej: Puerta trasera derecha"
                      maxLength={80}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-muted mb-1">Descripción (opcional)</label>
                    <Input
                      value={danoForm.descripcion}
                      onChange={e => setDanoForm(f => ({ ...f, descripcion: e.target.value }))}
                      placeholder="Ej: Raya superficial"
                      maxLength={120}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={guardarDescripcionDano}>
                    <Save className="h-3.5 w-3.5 mr-1" />
                    Guardar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { eliminarDano(editandoIdx); setEditandoIdx(null) }} className="text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Eliminar este daño
                  </Button>
                </div>
              </div>
            )}

            {/* Tabla de todos los daños */}
            {danos.length > 0 && (
              <div className="rounded-xl border border-line bg-surface overflow-hidden">
                <div className="px-4 py-2.5 border-b border-line">
                  <h3 className="text-sm font-semibold text-ink">Daños registrados ({danos.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line bg-surface-raised">
                        <th className="px-4 py-2 text-left text-xs text-ink-muted font-medium">#</th>
                        <th className="px-4 py-2 text-left text-xs text-ink-muted font-medium">Tipo</th>
                        <th className="px-4 py-2 text-left text-xs text-ink-muted font-medium">Vista</th>
                        <th className="px-4 py-2 text-left text-xs text-ink-muted font-medium">Zona</th>
                        <th className="px-4 py-2 text-left text-xs text-ink-muted font-medium">Descripción</th>
                        <th className="px-4 py-2 print:hidden" />
                      </tr>
                    </thead>
                    <tbody>
                      {danos.map((d, i) => {
                        const tipo = TIPOS_DANO.find(t => t.value === d.tipo)
                        return (
                          <tr key={d._tempId || d.id || i} className="border-b border-line last:border-0 hover:bg-surface-raised">
                            <td className="px-4 py-2.5">
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full text-white text-xs font-bold" style={{ backgroundColor: tipo?.color }}>
                                {i + 1}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-ink">{tipo?.label}</td>
                            <td className="px-4 py-2.5 text-ink-muted capitalize">{d.vista}</td>
                            <td className="px-4 py-2.5 text-ink">{d.ubicacion || <span className="text-ink-soft italic">—</span>}</td>
                            <td className="px-4 py-2.5 text-ink-muted">{d.descripcion || <span className="italic">—</span>}</td>
                            <td className="px-4 py-2.5 print:hidden">
                              <div className="flex gap-1.5">
                                <button onClick={() => abrirEdicion(i)} className="p-1 rounded hover:bg-surface-raised text-ink-muted hover:text-ink">
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => eliminarDano(i)} className="p-1 rounded hover:bg-red-50 text-ink-muted hover:text-red-600">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Observaciones generales */}
            <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
              <label className="block text-sm font-semibold text-ink">Observaciones generales</label>
              <textarea
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                placeholder="Ej: Pequeñas marcas de uso en pintura. Sin daños relevantes."
                maxLength={500}
                rows={3}
                className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none print:border-0 print:p-0 print:focus:ring-0"
              />
              <p className="text-xs text-ink-muted text-right print:hidden">{observaciones.length}/500</p>
            </div>

            {/* Botones de acción */}
            <div className="print:hidden flex flex-col sm:flex-row gap-3 justify-end">
              <Button variant="outline" onClick={() => navigate('/admin/agenda')}>
                Cancelar
              </Button>
              <Button onClick={handleGuardar} disabled={guardando} className="bg-accent-600 hover:bg-accent-700 text-white">
                {guardando
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</>
                  : <><Save className="h-4 w-4 mr-2" />{yaInspeccionado ? 'Actualizar inspección' : 'Guardar inspección'}</>
                }
              </Button>
            </div>
          </div>
        </div>

        {/* Sección de impresión — firma */}
        <div className="hidden print:block mt-8 pt-6 border-t border-line">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <p className="text-xs text-ink-muted">Responsable de la inspección</p>
              <div className="h-12 border-b border-ink-muted" />
              <p className="text-xs text-ink-muted">
                {inspeccion?.trabajador?.nombre || ''}
                {inspeccion?.trabajador?.cargo ? ` · ${inspeccion.trabajador.cargo}` : ''}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-ink-muted">Firma del cliente — He revisado el estado del vehículo</p>
              <div className="h-12 border-b border-ink-muted" />
              <p className="text-xs text-ink-muted">{reserva?.nombre}</p>
            </div>
          </div>
          <p className="text-xs text-ink-muted mt-4 text-center">
            {usuario?.tenant?.nombre || 'Taller'} · Inspección previa registrada el {new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

      </div>

      {/* Estilos de impresión */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .mx-auto, .mx-auto * { visibility: visible; }
          .mx-auto { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </AdminLayout>
  )
}
