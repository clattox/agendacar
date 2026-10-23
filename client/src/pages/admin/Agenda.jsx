import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarClock,
  CalendarDays,
  CalendarRange,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  History,
  Mail,
  MessageCircle,
  Phone,
  Download,
  Printer,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  XCircle
} from 'lucide-react'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { getUsuario } from '../../lib/auth'
import {
  addDays,
  formatDateFromISO,
  formatFullDate,
  formatTimeFromISO,
  formatWeekRange,
  getDateKeyInTimeZone,
  isSameDay,
  nowAsReservationDate,
  startOfWeek,
  toDateKey,
  toReservationDateKey
} from '../../lib/dates'
import { getApiErrorMessage } from '../../lib/errors'
import {
  actualizarEstadoReserva,
  asignarTrabajadoresReserva,
  eliminarReserva,
  exportarReservasCSV,
  listarReservasPorFecha,
  reagendarReserva
} from '../../services/reservasService'
import { obtenerHistorialVehiculo } from '../../services/vehiculosService'
import { listarTrabajadores } from '../../services/trabajadorService'
import AdminLayout from '../../components/admin/AdminLayout'
import EstadoBadge, { ESTADOS_RESERVA } from '../../components/admin/EstadoBadge'
import {
  Alert,
  Button,
  ConfirmDialog,
  Dialog,
  EmptyState,
  FormField,
  Input,
  SegmentedControl,
  Select,
  Skeleton
} from '../../components/ui'

const VISTAS = [
  { value: 'dia', label: 'Día', icon: CalendarDays },
  { value: 'semana', label: 'Semana', icon: CalendarRange }
]

const FILTROS = [
  { value: 'todas', label: 'Todos los estados' },
  { value: 'confirmada', label: 'Confirmadas' },
  { value: 'atendida', label: 'Atendidas' },
  { value: 'cancelada', label: 'Canceladas' }
]

export default function Agenda() {
  const navigate = useNavigate()
  const usuario = getUsuario()
  const inspeccionActiva = usuario?.tenant?.inspeccionActiva ?? false
  const [vista, setVista] = useState('dia')
  const [fecha, setFecha] = useState(() => new Date())
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [estado, setEstado] = useState('todas')
  const [busqueda, setBusqueda] = useState('')
  const [detalle, setDetalle] = useState(null)
  const [actualizando, setActualizando] = useState(null)
  const [reservaAEliminar, setReservaAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [reservaAReagendar, setReservaAReagendar] = useState(null)
  const [exportando, setExportando] = useState(false)

  useDocumentTitle('Agenda — AgendaCar')

  const inicioSemana = useMemo(() => startOfWeek(fecha), [fecha])
  const rangoKey = vista === 'dia' ? toDateKey(fecha) : toDateKey(inicioSemana)
  const diasSemana = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(inicioSemana, index)),
    [inicioSemana]
  )

  const cargar = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (vista === 'dia') {
        const data = await listarReservasPorFecha(toDateKey(fecha))
        setReservas(data)
      } else {
        const porDia = await Promise.all(
          diasSemana.map(dia => listarReservasPorFecha(toDateKey(dia)))
        )
        setReservas(porDia.flat())
      }
    } catch (err) {
      setReservas([])
      setError(getApiErrorMessage(err, 'No pudimos cargar la agenda.'))
    } finally {
      setLoading(false)
    }
    // fecha/diasSemana se controlan con rangoKey y vista.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangoKey, vista])

  useEffect(() => { cargar() }, [cargar])

  const cambiarEstado = async (id, nuevoEstado) => {
    if (actualizando) return
    setActualizando(id)
    setError('')
    try {
      const actualizada = await actualizarEstadoReserva(id, nuevoEstado)
      setDetalle(prev => (prev?.id === id ? { ...prev, ...actualizada } : prev))
      await cargar()
    } catch (err) {
      setError(getApiErrorMessage(err, 'No pudimos actualizar la reserva.'))
    } finally {
      setActualizando(null)
    }
  }

  const pedirEliminar = () => {
    if (!detalle || eliminando) return
    setReservaAEliminar(detalle)
    setDetalle(null)
  }

  const pedirReagendar = () => {
    if (!detalle || actualizando !== null || eliminando) return
    setReservaAReagendar(detalle)
    setDetalle(null)
  }

  const confirmarReagenda = async actualizada => {
    setReservaAReagendar(null)
    setDetalle(actualizada)
    await cargar()
  }

  const confirmarEliminar = async () => {
    if (!reservaAEliminar || eliminando) return

    setEliminando(true)
    setError('')
    try {
      await eliminarReserva(reservaAEliminar.id)
      setReservaAEliminar(null)
      await cargar()
    } catch (err) {
      setError(getApiErrorMessage(err, 'No pudimos eliminar la reserva.'))
      setReservaAEliminar(null)
    } finally {
      setEliminando(false)
    }
  }

  const mover = (direccion) => {
    setFecha(prev => addDays(prev, vista === 'dia' ? direccion : direccion * 7))
  }

  const irAHoy = () => setFecha(new Date())

  const filtradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    return reservas.filter(reserva => {
      if (estado !== 'todas' && reserva.estado !== estado) return false
      if (!termino) return true
      const texto = [
        reserva.nombre,
        reserva.patente,
        reserva.telefono,
        reserva.email,
        reserva.servicio?.nombre
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return texto.includes(termino)
    })
  }, [reservas, estado, busqueda])

  const reservasPorDia = useMemo(() => {
    const mapa = new Map(diasSemana.map(dia => [toDateKey(dia), []]))
    filtradas.forEach(reserva => {
      const clave = toReservationDateKey(reserva.fecha)
      if (mapa.has(clave)) mapa.get(clave).push(reserva)
    })
    return mapa
  }, [diasSemana, filtradas])

  const indicadoresDia = useMemo(() => {
    const pendientes = reservas.filter(reserva => reserva.estado === 'confirmada')
    const ahora = nowAsReservationDate()
    const proxima = pendientes
      .filter(reserva => new Date(reserva.fecha).getTime() >= ahora.getTime())
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))[0] || null

    return {
      total: reservas.length,
      pendientes: pendientes.length,
      proxima
    }
  }, [reservas])

  const titulo = vista === 'dia' ? formatFullDate(fecha) : formatWeekRange(inicioSemana)
  const esHoy = vista === 'dia'
    ? isSameDay(fecha, new Date())
    : isSameDay(inicioSemana, startOfWeek(new Date()))

  return (
    <AdminLayout>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="micro-label">Operación</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">Agenda</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Revisa las reservas del taller y actualiza cada atención.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={Download}
            onClick={async () => {
              setExportando(true)
              try {
                await exportarReservasCSV()
              } catch {
                setError('No se pudo exportar el archivo CSV.')
              } finally {
                setExportando(false)
              }
            }}
            disabled={exportando}
          >
            {exportando ? 'Exportando…' : 'Exportar CSV'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={RefreshCw}
            onClick={cargar}
            disabled={loading}
          >
            Actualizar
          </Button>
        </div>
      </header>

      {error && (
        <Alert variant="error" className="mt-5" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl
          options={VISTAS}
          value={vista}
          onChange={setVista}
          ariaLabel="Vista de agenda"
        />
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => mover(-1)} aria-label="Periodo anterior">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <p className="min-w-0 flex-1 px-1 text-center text-sm font-semibold capitalize text-ink sm:min-w-[18rem]">
            {titulo}
          </p>
          <Button variant="ghost" size="sm" onClick={() => mover(1)} aria-label="Periodo siguiente">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
          {!esHoy && (
            <Button variant="secondary" size="sm" onClick={irAHoy} className="ml-1">
              Hoy
            </Button>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
            aria-hidden="true"
          />
          <Input
            value={busqueda}
            onChange={event => setBusqueda(event.target.value)}
            placeholder="Buscar por cliente, patente, teléfono o servicio"
            aria-label="Buscar reservas"
            className="pl-9"
          />
        </div>
        <div className="sm:w-56">
          <Select
            value={estado}
            onChange={event => setEstado(event.target.value)}
            aria-label="Filtrar por estado"
          >
            {FILTROS.map(filtro => (
              <option key={filtro.value} value={filtro.value}>{filtro.label}</option>
            ))}
          </Select>
        </div>
      </div>

      {vista === 'dia' && (
        <section
          className="mt-4 grid gap-2 sm:grid-cols-3"
          aria-label="Indicadores operativos del día"
        >
          <IndicadorOperativo
            icon={CalendarDays}
            label="Total del día"
            value={loading ? '…' : indicadoresDia.total}
          />
          <IndicadorOperativo
            icon={CalendarClock}
            label="Pendientes de confirmar"
            value={loading ? '…' : indicadoresDia.pendientes}
          />
          <IndicadorOperativo
            icon={Clock}
            label="Próxima atención"
            value={
              loading
                ? '…'
                : indicadoresDia.proxima
                  ? formatTimeFromISO(indicadoresDia.proxima.fecha)
                  : 'Sin próximas'
            }
            detail={
              !loading && indicadoresDia.proxima
                ? indicadoresDia.proxima.servicio?.nombre
                : undefined
            }
          />
        </section>
      )}

      {vista === 'dia' ? (
        <div className="mt-4 space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-16" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                </div>
              </div>
            ))
          ) : filtradas.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title={reservas.length === 0 ? 'Sin reservas para este día' : 'Sin resultados'}
              description={
                reservas.length === 0
                  ? 'Cuando existan reservas para la fecha seleccionada, aparecerán en este listado.'
                  : 'Prueba con otro estado o limpia la búsqueda para ver todas las reservas.'
              }
              action={
                reservas.length > 0 && (estado !== 'todas' || busqueda)
                  ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => { setEstado('todas'); setBusqueda('') }}
                    >
                      Limpiar filtros
                    </Button>
                  )
                  : undefined
              }
            />
          ) : (
            filtradas.map(reserva => (
              <ReservaCard
                key={reserva.id}
                reserva={reserva}
                onOpen={() => setDetalle(reserva)}
                onEstado={cambiarEstado}
                actualizando={actualizando}
                inspeccionActiva={inspeccionActiva}
              />
            ))
          )}
        </div>
      ) : (
        <div className="mt-4">
          {loading ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
              {Array.from({ length: 7 }).map((_, index) => (
                <Skeleton key={index} className="h-40 w-full" />
              ))}
            </div>
          ) : filtradas.length === 0 ? (
            <EmptyState
              icon={CalendarRange}
              title="Sin reservas esta semana"
              description="No hay reservas que coincidan con los filtros para la semana seleccionada."
            />
          ) : (
            <>
            {/* Mobile: lista compacta de 7 días */}
            <div className="xl:hidden space-y-1.5">
              {diasSemana.map(dia => {
                const delDia = (reservasPorDia.get(toDateKey(dia)) || [])
                  .slice()
                  .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
                const hoy = isSameDay(dia, new Date())
                const seleccionado = isSameDay(dia, fecha)
                const estadosUnicos = [...new Set(delDia.map(r => r.estado))]
                const colorDot = {
                  confirmada: 'bg-accent-500',
                  atendida:   'bg-green-500',
                  cancelada:  'bg-graphite-400',
                  pendiente:  'bg-yellow-400'
                }
                return (
                  <button
                    key={toDateKey(dia)}
                    type="button"
                    onClick={() => { setFecha(dia); setVista('dia') }}
                    aria-label={`Ver reservas del ${dia.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}`}
                    className={`w-full flex items-center gap-3 rounded-xl border bg-surface px-3 py-3 text-left transition-colors hover:bg-graphite-50 focus-ring ${
                      seleccionado ? 'border-accent-400 ring-1 ring-accent-200' :
                      hoy          ? 'border-accent-300' : 'border-line'
                    }`}
                  >
                    {/* Día + fecha */}
                    <div className={`w-14 shrink-0 text-center rounded-lg py-1 ${
                      seleccionado ? 'bg-accent-500 text-white' : hoy ? 'bg-accent-50' : ''
                    }`}>
                      <p className={`text-[10px] font-semibold uppercase tracking-wide ${seleccionado ? 'text-white/80' : 'text-ink-soft'}`}>
                        {dia.toLocaleDateString('es-CL', { weekday: 'short' })}
                      </p>
                      <p className={`text-base font-bold font-tabular leading-tight ${seleccionado ? 'text-white' : hoy ? 'text-accent-600' : 'text-ink'}`}>
                        {dia.getDate()}
                      </p>
                    </div>

                    {/* Contenido */}
                    <div className="min-w-0 flex-1">
                      {delDia.length === 0 ? (
                        <p className="text-xs text-ink-soft">Sin reservas</p>
                      ) : (
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-sm font-semibold text-ink">
                            {delDia.length} {delDia.length === 1 ? 'reserva' : 'reservas'}
                          </span>
                          {/* Puntos de estado */}
                          <span className="flex items-center gap-1" aria-hidden="true">
                            {estadosUnicos.map(est => (
                              <span
                                key={est}
                                title={est}
                                className={`h-2 w-2 rounded-full ${colorDot[est] || 'bg-graphite-300'}`}
                              />
                            ))}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Acción */}
                    <span className="shrink-0 flex items-center gap-1 text-xs font-medium text-accent-600">
                      Ver
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Desktop: cuadrícula de 7 columnas (sin cambios) */}
            <div className="hidden xl:grid gap-3 xl:grid-cols-7">
              {diasSemana.map(dia => {
                const delDia = (reservasPorDia.get(toDateKey(dia)) || [])
                  .slice()
                  .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
                const hoy = isSameDay(dia, new Date())
                return (
                  <section
                    key={toDateKey(dia)}
                    className={`rounded-xl border bg-surface p-2.5 ${
                      hoy ? 'border-accent-300 ring-1 ring-accent-200' : 'border-line'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-1 border-b border-line pb-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-soft">
                          {dia.toLocaleDateString('es-CL', { weekday: 'short' })}
                        </p>
                        <p className="text-sm font-bold font-tabular text-ink">
                          {dia.getDate()}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold text-ink-soft">
                        {delDia.length}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1.5">
                      {delDia.length === 0 ? (
                        <p className="py-4 text-center text-[11px] text-ink-soft">Sin reservas</p>
                      ) : (
                        delDia.map(reserva => (
                          <button
                            key={reserva.id}
                            type="button"
                            onClick={() => setDetalle(reserva)}
                            aria-label={`Ver detalle de ${reserva.nombre} a las ${formatTimeFromISO(reserva.fecha)}`}
                            className="w-full rounded-md border border-line bg-graphite-50 px-2 py-1.5 text-left transition-colors hover:border-graphite-300 hover:bg-graphite-100 focus-ring"
                          >
                            <p className="text-[11px] font-bold font-tabular text-ink">
                              {formatTimeFromISO(reserva.fecha)}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] font-medium text-ink-muted">
                              {reserva.nombre}
                            </p>
                            <p className="truncate font-mono text-[10px] uppercase text-ink-soft">
                              {reserva.patente}
                            </p>
                            <EstadoBadge estado={reserva.estado} size="sm" />
                          </button>
                        ))
                      )}
                    </div>
                  </section>
                )
              })}
            </div>
          </>
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-ink-muted">
        {loading
          ? 'Cargando agenda…'
          : `${filtradas.length} de ${reservas.length} reservas visibles`}
      </p>


      <Dialog
        open={Boolean(detalle)}
        onClose={() => setDetalle(null)}
        size="md"
        title={detalle ? `Reserva #${detalle.id}` : 'Detalle de reserva'}
        description={detalle ? detalle.servicio?.nombre : undefined}
        footer={
          detalle && (
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <Button variant="secondary" onClick={() => setDetalle(null)}>
                Cerrar
              </Button>
              <Button
                variant="danger-ghost"
                leftIcon={Trash2}
                onClick={pedirEliminar}
                disabled={actualizando !== null || eliminando}
              >
                Eliminar
              </Button>
              <Button
                variant="secondary"
                leftIcon={CalendarClock}
                onClick={pedirReagendar}
                disabled={actualizando !== null || eliminando}
              >
                Reagendar
              </Button>
              {inspeccionActiva && detalle.servicio?.requiereInspeccion && (
                <Button
                  variant="secondary"
                  leftIcon={ClipboardList}
                  onClick={() => navigate(`/admin/inspeccion/${detalle.id}`)}
                >
                  {detalle.estado === 'inspeccionada' ? 'Ver inspección' : 'Inspeccionar'}
                </Button>
              )}
              {(detalle.estado === 'confirmada' || detalle.estado === 'inspeccionada') && (
                <>
                  <Button
                    variant="danger-ghost"
                    leftIcon={XCircle}
                    onClick={() => cambiarEstado(detalle.id, 'cancelada')}
                    loading={actualizando === detalle.id}
                    disabled={actualizando !== null || eliminando}
                  >
                    Cancelar reserva
                  </Button>
                  <Button
                    variant="success"
                    leftIcon={CheckCircle2}
                    onClick={() => cambiarEstado(detalle.id, 'atendida')}
                    loading={actualizando === detalle.id}
                    disabled={actualizando !== null || eliminando}
                  >
                    Marcar atendida
                  </Button>
                </>
              )}
            </div>
          )
        }
      >
        {detalle && <DetalleReserva reserva={detalle} onActualizar={setDetalle} />}
      </Dialog>

      <ConfirmDialog
        open={Boolean(reservaAEliminar)}
        onClose={() => { if (!eliminando) setReservaAEliminar(null) }}
        onConfirm={confirmarEliminar}
        title="Eliminar reserva"
        description={
          reservaAEliminar
            ? `Se eliminará definitivamente la reserva de ${reservaAEliminar.nombre} del ${formatDateFromISO(reservaAEliminar.fecha)} a las ${formatTimeFromISO(reservaAEliminar.fecha)}.`
            : undefined
        }
        confirmLabel="Eliminar"
        loading={eliminando}
      />

      {reservaAReagendar && (
        <ReagendarReservaDialog
          reserva={reservaAReagendar}
          onClose={() => setReservaAReagendar(null)}
          onSaved={confirmarReagenda}
        />
      )}
    </AdminLayout>
  )
}

function ReagendarReservaDialog({ reserva, onClose, onSaved }) {
  const formId = useId()
  const [fecha, setFecha] = useState(() => toReservationDateKey(reserva.fecha))
  const [hora, setHora] = useState(() => formatTimeFromISO(reserva.fecha))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const cerrar = () => {
    if (!guardando) onClose()
  }

  const guardar = async event => {
    event.preventDefault()
    if (guardando) return

    if (!fecha || !hora) {
      setError('Selecciona una fecha y una hora.')
      return
    }

    setGuardando(true)
    setError('')
    try {
      const actualizada = await reagendarReserva(reserva.id, { fecha, hora })
      onSaved(actualizada)
    } catch (err) {
      setError(getApiErrorMessage(err, 'No pudimos reagendar la reserva.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog
      open
      onClose={cerrar}
      title="Reagendar reserva"
      description={reserva.servicio?.nombre}
      footer={
        <>
          <Button variant="secondary" onClick={cerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={guardando}>
            Guardar cambios
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={guardar} className="space-y-4">
        <div className="rounded-lg border border-line bg-graphite-50 p-4">
          <p className="micro-label">Reserva actual</p>
          <p className="mt-1 text-sm font-semibold text-ink">
            {formatDateFromISO(reserva.fecha)} · {formatTimeFromISO(reserva.fecha)}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            {reserva.nombre} · {reserva.patente}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id={`${formId}-fecha`} label="Nueva fecha" required>
            <Input
              id={`${formId}-fecha`}
              type="date"
              value={fecha}
              min={getDateKeyInTimeZone()}
              onChange={event => setFecha(event.target.value)}
              required
              disabled={guardando}
            />
          </FormField>

          <FormField id={`${formId}-hora`} label="Nueva hora" required>
            <Input
              id={`${formId}-hora`}
              type="time"
              value={hora}
              onChange={event => setHora(event.target.value)}
              required
              disabled={guardando}
            />
          </FormField>
        </div>

        <p className="text-xs text-ink-muted">
          El servicio, el cliente y la patente se mantienen sin cambios.
        </p>

        {error && <Alert variant="error">{error}</Alert>}
      </form>
    </Dialog>
  )
}

function IndicadorOperativo({ icon: Icon, label, value, detail }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 shadow-card">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-graphite-50 text-ink-muted">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-bold font-tabular text-ink">{value}</p>
        {detail && (
          <p className="truncate text-xs text-ink-muted">{detail}</p>
        )}
      </div>
    </div>
  )
}

function ReservaCard({ reserva, onOpen, onEstado, actualizando, inspeccionActiva }) {
  const navigate = useNavigate()
  const requiereInspeccion = inspeccionActiva && reserva.servicio?.requiereInspeccion
  const yaInspeccionada = reserva.estado === 'inspeccionada'

  return (
    <article className={`overflow-hidden rounded-xl border bg-surface shadow-card ${
      reserva.estado === 'atendida'      ? 'border-l-4 border-l-green-500 border-line' :
      reserva.estado === 'cancelada'     ? 'border-l-4 border-l-graphite-400 border-line' :
      reserva.estado === 'inspeccionada' ? 'border-l-4 border-l-yellow-400 border-line' :
                                           'border-l-4 border-l-accent-500 border-line'
    }`}>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full flex-wrap items-start gap-3 p-4 text-left transition-colors hover:bg-graphite-50 focus-ring sm:flex-nowrap"
      >
        <div className="flex h-12 w-16 shrink-0 flex-col items-center justify-center rounded-lg border border-line bg-graphite-50">
          <span className="text-base font-bold font-tabular leading-none text-ink">
            {formatTimeFromISO(reserva.fecha)}
          </span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
            {reserva.servicio?.duracion || 0} min
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-ink">{reserva.nombre}</p>
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
              {reserva.patente}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-ink-muted">
            {reserva.servicio?.nombre || 'Servicio sin nombre'}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-ink-soft">
            <a
              href={`https://wa.me/${normalizarTelefonoWhatsApp(reserva.telefono)}`}
              target="_blank"
              rel="noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-green-700 hover:underline"
            >
              <Phone className="h-3 w-3" aria-hidden="true" />
              {reserva.telefono}
            </a>
            {reserva.email && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{reserva.email}</span>
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <EstadoBadge estado={reserva.estado} />
          <ChevronRight className="h-4 w-4 text-ink-soft" aria-hidden="true" />
        </div>
      </button>

      {(reserva.estado === 'confirmada' || reserva.estado === 'inspeccionada' || requiereInspeccion) && (
        <div className="flex flex-col gap-2 border-t border-line bg-graphite-50 px-4 py-2.5 sm:flex-row sm:justify-end">
          {requiereInspeccion && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={ClipboardList}
              onClick={() => navigate(`/admin/inspeccion/${reserva.id}`)}
              disabled={actualizando !== null}
            >
              {yaInspeccionada ? 'Ver inspección' : 'Inspeccionar'}
            </Button>
          )}
          {(reserva.estado === 'confirmada' || reserva.estado === 'inspeccionada') && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onEstado(reserva.id, 'cancelada')}
                loading={actualizando === reserva.id}
                disabled={actualizando !== null}
              >
                Cancelar
              </Button>
              <Button
                variant="success"
                size="sm"
                leftIcon={CheckCircle2}
                onClick={() => onEstado(reserva.id, 'atendida')}
                loading={actualizando === reserva.id}
                disabled={actualizando !== null}
              >
                Marcar atendida
              </Button>
            </>
          )}
        </div>
      )}
    </article>
  )
}

function DetalleReserva({ reserva, onActualizar }) {
  const [historialAbierto, setHistorialAbierto] = useState(false)
  const [trabajadoresTenant, setTrabajadoresTenant] = useState([])
  const [seleccionados, setSeleccionados] = useState(() =>
    (reserva.trabajadores ?? []).map(t => t.id)
  )
  const [guardando, setGuardando] = useState(false)
  const [errorTrabajadores, setErrorTrabajadores] = useState('')

  useEffect(() => {
    listarTrabajadores()
      .then(lista => setTrabajadoresTenant(lista.filter(t => t.activo)))
      .catch(() => {}) // silencioso — no bloquea el flujo principal
  }, [])

  const toggleTrabajador = (id) => {
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const guardarAsignacion = async () => {
    setGuardando(true)
    setErrorTrabajadores('')
    try {
      const actualizada = await asignarTrabajadoresReserva(reserva.id, seleccionados)
      onActualizar?.(actualizada)
    } catch {
      setErrorTrabajadores('No se pudo guardar la asignación. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  const asignadosOriginales = (reserva.trabajadores ?? []).map(t => t.id).sort().join(',')
  const asignadosActuales = [...seleccionados].sort().join(',')
  const haycambios = asignadosOriginales !== asignadosActuales
  const vehiculo = reserva.vehiculo
  const kilometraje = reserva.kilometraje ?? vehiculo?.kilometraje
  const datosVehiculo = [
    { label: 'Patente', value: <span className="font-mono uppercase">{reserva.patente}</span> },
    { label: 'Marca', value: vehiculo?.marca },
    { label: 'Modelo', value: vehiculo?.modelo },
    { label: 'Año', value: vehiculo?.anio },
    {
      label: 'Kilometraje',
      value: kilometraje !== null && kilometraje !== undefined
        ? `${kilometraje.toLocaleString('es-CL')} km`
        : null
    },
    { label: 'Observaciones', value: reserva.notas }
  ].filter(item => item.value !== null && item.value !== undefined && item.value !== '')

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-graphite-50 p-4">
        <div>
          <p className="text-2xl font-bold font-tabular leading-none text-ink">
            {formatTimeFromISO(reserva.fecha)}
          </p>
          <p className="mt-1.5 text-xs capitalize text-ink-muted">
            {formatDateFromISO(reserva.fecha)}
          </p>
        </div>
        <div className="text-right">
          <EstadoBadge estado={reserva.estado} />
          <p className="mt-1.5 text-xs text-ink-muted">
            {reserva.servicio?.duracion || 0} minutos
          </p>
        </div>
      </div>

      <dl className="mt-4 divide-y divide-line">
        <FilaDetalle icon={UserRound} label="Cliente" value={reserva.nombre} />
        <FilaDetalle
          icon={Phone}
          label="Teléfono"
          value={
            <a href={`tel:${reserva.telefono}`} className="text-accent-600 hover:underline">
              {reserva.telefono}
            </a>
          }
        />
        <FilaDetalle
          icon={Mail}
          label="Email"
          value={
            reserva.email
              ? <a href={`mailto:${reserva.email}`} className="text-accent-600 hover:underline">{reserva.email}</a>
              : <span className="text-ink-soft">No registrado</span>
          }
        />
        <FilaDetalle
          icon={CalendarDays}
          label="Servicio"
          value={reserva.servicio?.nombre || 'Servicio sin nombre'}
        />
      </dl>

      <section className="mt-5 overflow-hidden rounded-lg border border-line">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-graphite-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-ink-soft" aria-hidden="true" />
            <div>
              <h3 className="text-sm font-semibold text-ink">Vehículo</h3>
              <p className="text-xs text-ink-muted">Datos registrados para esta patente</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={History}
            onClick={() => setHistorialAbierto(true)}
          >
            Ver historial
          </Button>
        </div>

        <dl className="grid gap-x-4 gap-y-3 px-4 py-3 sm:grid-cols-2">
          {datosVehiculo.map(dato => (
            <div key={dato.label}>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
                {dato.label}
              </dt>
              <dd className="mt-0.5 break-words text-sm font-medium text-ink">{dato.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Sección de trabajadores ─────────────────────────────────────── */}
      {trabajadoresTenant.length > 0 && (
        <section className="mt-5 overflow-hidden rounded-lg border border-line">
          <div className="flex items-center gap-2 border-b border-line bg-graphite-50 px-4 py-3">
            <UserRound className="h-4 w-4 text-ink-soft" aria-hidden="true" />
            <div>
              <h3 className="text-sm font-semibold text-ink">Trabajadores</h3>
              <p className="text-xs text-ink-muted">Quiénes atendieron este vehículo</p>
            </div>
          </div>

          <div className="px-4 py-3 space-y-2">
            {trabajadoresTenant.map(t => (
              <label key={t.id} className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={seleccionados.includes(t.id)}
                  onChange={() => toggleTrabajador(t.id)}
                  className="h-4 w-4 rounded border-line accent-accent-600"
                />
                <span className="text-sm text-ink">{t.nombre}</span>
                {t.cargo && (
                  <span className="text-xs text-ink-muted">— {t.cargo}</span>
                )}
              </label>
            ))}
          </div>

          {errorTrabajadores && (
            <p className="px-4 pb-2 text-xs text-red-500">{errorTrabajadores}</p>
          )}

          <div className="border-t border-line px-4 py-3">
            <Button
              variant="primary"
              size="sm"
              onClick={guardarAsignacion}
              loading={guardando}
              disabled={!haycambios || guardando}
            >
              Guardar asignación
            </Button>
          </div>
        </section>
      )}

      {historialAbierto && (
        <HistorialVehiculoDialog
          patente={reserva.patente}
          telefono={reserva.telefono}
          onClose={() => setHistorialAbierto(false)}
        />
      )}
    </div>
  )
}

function HistorialVehiculoDialog({ patente, telefono, onClose }) {
  const [vehiculo, setVehiculo] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [errorAccion, setErrorAccion] = useState('')

  useEffect(() => {
    let activo = true
    setCargando(true)
    setError('')
    setErrorAccion('')
    setVehiculo(null)

    obtenerHistorialVehiculo(patente)
      .then(data => {
        if (activo) setVehiculo(data)
      })
      .catch(err => {
        if (!activo) return

        if (err.response?.status === 404) {
          setVehiculo({ patente, reservas: [] })
        } else {
          setError(getApiErrorMessage(err, 'No pudimos cargar el historial del vehículo.'))
        }
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => { activo = false }
  }, [patente])

  const reservas = vehiculo?.reservas || []
  const detalle = [vehiculo?.marca, vehiculo?.modelo, vehiculo?.anio]
    .filter(Boolean)
    .join(' · ')
  const kilometraje = vehiculo?.kilometraje
  const accionesDeshabilitadas = cargando || Boolean(error)

  const imprimir = () => {
    setErrorAccion('')
    const ventana = abrirVistaImpresionHistorial({
      patente,
      detalle,
      kilometraje,
      reservas
    })

    if (!ventana) {
      setErrorAccion('El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes e inténtalo nuevamente.')
    }
  }

  const compartirPorWhatsApp = () => {
    setErrorAccion('')
    abrirWhatsAppHistorial({
      patente,
      telefono,
      detalle,
      kilometraje,
      reservas
    })
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={`Historial · ${patente}`}
      description={detalle || 'Últimas atenciones registradas en el taller'}
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            variant="secondary"
            leftIcon={Printer}
            onClick={imprimir}
            disabled={accionesDeshabilitadas}
          >
            Imprimir
          </Button>
          <Button
            variant="success"
            leftIcon={MessageCircle}
            onClick={compartirPorWhatsApp}
            disabled={accionesDeshabilitadas}
          >
            Compartir por WhatsApp
          </Button>
        </div>
      }
    >
      {errorAccion && (
        <div className="mb-4">
          <Alert variant="error">{errorAccion}</Alert>
        </div>
      )}
      {cargando ? (
        <div className="space-y-2" aria-label="Cargando historial">
          {[0, 1, 2].map(item => (
            <Skeleton key={item} className="h-16 w-full" />
          ))}
        </div>
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : reservas.length === 0 ? (
        <EmptyState
          icon={History}
          title="Sin atenciones registradas"
          description={`No encontramos atenciones anteriores para la patente ${patente}.`}
        />
      ) : (
        <>
          <p className="mb-3 text-xs text-ink-muted">
            {reservas.length === 1
              ? '1 atención registrada'
              : `${reservas.length} atenciones registradas`}
          </p>
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
            {reservas.map(reserva => (
              <li
                key={reserva.id}
                className="px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      {reserva.servicio?.nombre || 'Servicio sin nombre'}
                    </p>
                    <p className="mt-0.5 text-xs capitalize text-ink-muted">
                      {formatDateFromISO(reserva.fecha)} · {formatTimeFromISO(reserva.fecha)}
                    </p>
                  </div>
                  <EstadoBadge estado={reserva.estado} size="sm" />
                </div>
                {reserva.notas && (
                  <p className="mt-1.5 text-xs text-ink-muted italic border-l-2 border-line pl-2">
                    {reserva.notas}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </Dialog>
  )
}

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, caracter => HTML_ESCAPES[caracter])
}

function labelEstadoVehiculo(estado) {
  return ESTADOS_RESERVA[estado]?.label || estado || 'Sin estado'
}

function textoReservaHistorial(reserva) {
  const servicio = reserva.servicio?.nombre || 'Servicio sin nombre'
  const base = `${formatDateFromISO(reserva.fecha)} · ${formatTimeFromISO(reserva.fecha)} — ${servicio} (${labelEstadoVehiculo(reserva.estado)})`
  return reserva.notas ? `${base}\n  📝 ${reserva.notas}` : base
}

function normalizarTelefonoWhatsApp(telefono) {
  const texto = String(telefono || '').trim()
  const digitos = texto.replace(/\D/g, '')

  if (!digitos) return ''
  if (texto.startsWith('+')) return digitos
  if (digitos.length === 9) return `56${digitos}`

  return digitos
}

function construirMensajeHistorial({ patente, detalle, kilometraje, reservas }) {
  const lineas = [
    `Historial del vehículo ${patente}`,
    detalle || null,
    kilometraje !== null && kilometraje !== undefined
      ? `Kilometraje: ${Number(kilometraje).toLocaleString('es-CL')} km`
      : null,
    '',
    reservas.length === 0
      ? 'Sin atenciones registradas.'
      : reservas.map(reserva => `• ${textoReservaHistorial(reserva)}`).join('\n')
  ]

  return lineas.filter(linea => linea !== null).join('\n')
}

function abrirWhatsAppHistorial(datos) {
  const mensaje = construirMensajeHistorial(datos)
  const numero = normalizarTelefonoWhatsApp(datos.telefono)
  const url = numero
    ? `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
    : `https://wa.me/?text=${encodeURIComponent(mensaje)}`
  const enlace = document.createElement('a')

  enlace.href = url
  enlace.target = '_blank'
  enlace.rel = 'noopener noreferrer'
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
}

function abrirVistaImpresionHistorial({ patente, detalle, kilometraje, reservas }) {
  const ventana = window.open('', '_blank', 'width=900,height=700')
  if (!ventana) return null

  ventana.opener = null

  const filas = reservas.length
    ? reservas.map(reserva => `
        <tr>
          <td>${escapeHtml(formatDateFromISO(reserva.fecha))}</td>
          <td class="hora">${escapeHtml(formatTimeFromISO(reserva.fecha))}</td>
          <td>${escapeHtml(reserva.servicio?.nombre || 'Servicio sin nombre')}</td>
          <td>${escapeHtml(labelEstadoVehiculo(reserva.estado))}</td>
          <td class="notas">${reserva.notas ? escapeHtml(reserva.notas) : '<span class="sin-notas">—</span>'}</td>
        </tr>`).join('')
    : '<tr><td colspan="5" class="vacio">Sin atenciones registradas.</td></tr>'

  const kilometrajeHtml = kilometraje !== null && kilometraje !== undefined
    ? `<p class="meta">Kilometraje registrado: <strong>${Number(kilometraje).toLocaleString('es-CL')} km</strong></p>`
    : ''

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Historial ${escapeHtml(patente)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 40px;
      color: #24272b;
      background: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    header {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      border-bottom: 2px solid #24272b;
      padding-bottom: 18px;
    }
    h1 { margin: 0; font-size: 22px; }
    .patente {
      margin: 8px 0 0;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.08em;
    }
    .meta { margin: 6px 0 0; color: #69717b; font-size: 13px; }
    .resumen {
      margin: 0;
      color: #69717b;
      font-size: 12px;
      text-align: right;
      white-space: nowrap;
    }
    table { width: 100%; margin-top: 24px; border-collapse: collapse; font-size: 13px; }
    th {
      padding: 10px 12px;
      border-bottom: 1px solid #24272b;
      font-size: 10px;
      letter-spacing: 0.1em;
      text-align: left;
      text-transform: uppercase;
    }
    td { padding: 11px 12px; border-bottom: 1px solid #e1e3e6; vertical-align: top; }
    .hora { white-space: nowrap; font-variant-numeric: tabular-nums; }
    .notas { color: #69717b; font-style: italic; }
    .sin-notas { color: #b0b5bb; }
    .vacio { padding: 28px 12px; color: #69717b; text-align: center; }
    footer { margin-top: 28px; color: #69717b; font-size: 11px; }
    @media print {
      body { padding: 0; }
      thead { display: table-header-group; }
      tr { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Historial del vehículo</h1>
      <p class="patente">${escapeHtml(patente)}</p>
      ${detalle ? `<p class="meta">${escapeHtml(detalle)}</p>` : ''}
      ${kilometrajeHtml}
    </div>
    <p class="resumen">${reservas.length} ${reservas.length === 1 ? 'atención' : 'atenciones'}</p>
  </header>
  <table>
    <thead>
      <tr><th>Fecha</th><th>Hora</th><th>Servicio</th><th>Estado</th><th>Observaciones</th></tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>
  <footer>Historial generado por AgendaCar el ${escapeHtml(formatFullDate(new Date()))}.</footer>
</body>
</html>`

  ventana.document.open()
  ventana.document.write(html)
  ventana.document.close()
  ventana.focus()
  ventana.onafterprint = () => ventana.close()
  ventana.setTimeout(() => ventana.print(), 200)

  return ventana
}

function FilaDetalle({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
          {label}
        </dt>
        <dd className="mt-0.5 break-words text-sm font-medium text-ink">{value}</dd>
      </div>
    </div>
  )
}

