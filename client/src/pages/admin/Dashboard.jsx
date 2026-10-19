import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleSlash,
  Clock,
  RefreshCw
} from 'lucide-react'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { formatLongDate, formatTimeFromISO, toDateKey } from '../../lib/dates'
import { getApiErrorMessage } from '../../lib/errors'
import {
  actualizarEstadoReserva,
  listarReservasPorFecha
} from '../../services/reservasService'
import AdminLayout from '../../components/admin/AdminLayout'
import EstadoBadge from '../../components/admin/EstadoBadge'
import { Alert, Button, EmptyState, Skeleton } from '../../components/ui'

export default function Dashboard() {
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actualizando, setActualizando] = useState(null)
  const hoy = new Date()

  useDocumentTitle('Panel — AgendaCar')

  const cargar = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listarReservasPorFecha(toDateKey(hoy))
      setReservas(data)
    } catch (err) {
      setReservas([])
      setError(getApiErrorMessage(err, 'No pudimos cargar las reservas de hoy.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const cambiarEstado = async (id, estado) => {
    if (actualizando) return
    setActualizando(id)
    setError('')
    try {
      await actualizarEstadoReserva(id, estado)
      await cargar()
    } catch (err) {
      setError(getApiErrorMessage(err, 'No pudimos actualizar la reserva.'))
    } finally {
      setActualizando(null)
    }
  }

  const confirmadas = reservas.filter(reserva => reserva.estado === 'confirmada')
  const atendidas = reservas.filter(reserva => reserva.estado === 'atendida')
  const canceladas = reservas.filter(reserva => reserva.estado === 'cancelada')
  const proxima = confirmadas.find(reserva => new Date(reserva.fecha) >= new Date())

  return (
    <AdminLayout>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="micro-label">Resumen del día</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">
            {formatLongDate(hoy)}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Estado de la agenda y atenciones registradas para hoy.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={RefreshCw}
          onClick={cargar}
          disabled={loading}
        >
          Actualizar
        </Button>
      </header>

      {error && (
        <Alert variant="error" className="mt-5" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        <section className="relative overflow-hidden rounded-xl bg-graphite-950 p-5 text-white lg:col-span-5">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                'linear-gradient(#8C939D 1px, transparent 1px), linear-gradient(90deg, #8C939D 1px, transparent 1px)',
              backgroundSize: '36px 36px'
            }}
            aria-hidden="true"
          />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
                Próxima atención
              </p>
              <CalendarCheck2 className="h-4 w-4 text-accent-300" aria-hidden="true" />
            </div>

            {loading ? (
              <div className="mt-5 space-y-3">
                <div className="h-9 w-24 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
                <div className="h-3 w-32 animate-pulse rounded bg-white/10" />
              </div>
            ) : proxima ? (
              <>
                <p className="mt-4 text-4xl font-bold font-tabular tracking-tight">
                  {formatTimeFromISO(proxima.fecha)}
                </p>
                <p className="mt-2 text-base font-semibold">{proxima.nombre}</p>
                <p className="mt-1 text-sm text-white/60">
                  {proxima.patente} · {proxima.servicio?.nombre || 'Servicio'}
                </p>
                <Link
                  to="/admin/agenda"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-300 transition-colors hover:text-accent-200 focus-ring"
                >
                  Ver agenda completa
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </>
            ) : (
              <>
                <p className="mt-4 text-xl font-semibold">Sin atenciones pendientes</p>
                <p className="mt-1 text-sm text-white/60">
                  No quedan reservas confirmadas para hoy.
                </p>
                <Link
                  to="/admin/agenda"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-300 transition-colors hover:text-accent-200 focus-ring"
                >
                  Revisar agenda
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </>
            )}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-4 lg:col-span-7">
          <MetricCard
            icon={Clock}
            label="Confirmadas"
            value={confirmadas.length}
            detail="Pendientes de atención"
            tone="accent"
            loading={loading}
          />
          <MetricCard
            icon={CheckCircle2}
            label="Atendidas"
            value={atendidas.length}
            detail="Completadas hoy"
            tone="success"
            loading={loading}
          />
          <MetricCard
            icon={CalendarDays}
            label="Total del día"
            value={reservas.length}
            detail="Todas las reservas"
            tone="neutral"
            loading={loading}
          />
          <MetricCard
            icon={CircleSlash}
            label="Canceladas"
            value={canceladas.length}
            detail="No se presentaron"
            tone="muted"
            loading={loading}
          />
        </div>
      </div>



      <section className="mt-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-ink">Agenda de hoy</h2>
            <p className="mt-0.5 text-sm text-ink-muted">
              {loading ? 'Cargando reservas…' : `${reservas.length} ${reservas.length === 1 ? 'reserva registrada' : 'reservas registradas'}`}
            </p>
          </div>
          <Link
            to="/admin/agenda"
            className="inline-flex items-center gap-1 text-sm font-semibold text-ink-muted transition-colors hover:text-ink focus-ring"
          >
            Ver agenda
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-4 space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
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
          ) : reservas.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No hay reservas para hoy"
              description="Cuando un cliente reserve una hora, aparecerá aquí con su detalle de contacto."
            />
          ) : (
            reservas.map(reserva => (
              <article
                key={reserva.id}
                className="rounded-xl border border-line bg-surface p-4 shadow-card"
              >
                <div className="flex flex-wrap items-start gap-3 sm:flex-nowrap">
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
                    <p className="mt-1 text-xs text-ink-soft">
                      {reserva.telefono}
                      {reserva.email ? ` · ${reserva.email}` : ''}
                    </p>
                  </div>

                  <EstadoBadge estado={reserva.estado} />
                </div>

                {reserva.estado === 'confirmada' && (
                  <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3 sm:flex-row sm:justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => cambiarEstado(reserva.id, 'cancelada')}
                      loading={actualizando === reserva.id}
                      disabled={actualizando !== null}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      leftIcon={CheckCircle2}
                      onClick={() => cambiarEstado(reserva.id, 'atendida')}
                      loading={actualizando === reserva.id}
                      disabled={actualizando !== null}
                    >
                      Marcar atendida
                    </Button>
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </section>
    </AdminLayout>
  )
}

const TONES = {
  accent: { box: 'bg-accent-50 text-accent-600', value: 'text-ink' },
  success: { box: 'bg-success-50 text-success-600', value: 'text-ink' },
  neutral: { box: 'bg-graphite-100 text-graphite-600', value: 'text-ink' },
  muted: { box: 'bg-graphite-100 text-graphite-400', value: 'text-ink-muted' }
}

function MetricCard({ icon: Icon, label, value, detail, tone = 'neutral', loading }) {
  const styles = TONES[tone] || TONES.neutral
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded ${styles.box}`}>
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <span className="text-xs font-semibold text-ink-muted">{label}</span>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-12" />
      ) : (
        <p className={`mt-2 text-3xl font-bold font-tabular tracking-tight ${styles.value}`}>
          {value}
        </p>
      )}
      <p className="mt-1 text-[11px] text-ink-soft">{detail}</p>
    </div>
  )
}
