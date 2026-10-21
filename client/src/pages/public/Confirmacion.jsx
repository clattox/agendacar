import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CalendarPlus, Car, CheckCircle2, Home, Phone } from 'lucide-react'
import {
  IconCalendarDot,
  IconClockThin,
  IconWrench,
} from '../../components/public/FeatureIcons'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { formatDateFromISO, formatTimeFromISO } from '../../lib/dates'
import TenantHeader from '../../components/public/TenantHeader'
import PublicFooter from '../../components/public/PublicFooter'
import { Badge, buttonClasses } from '../../components/ui'

const ESTADOS = {
  confirmada: { label: 'Confirmada', variant: 'success' },
  atendida: { label: 'Atendida', variant: 'neutral' },
  cancelada: { label: 'Cancelada', variant: 'danger' }
}

export default function Confirmacion() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { reserva, tenant } = state || {}

  useDocumentTitle(reserva ? 'Reserva confirmada' : 'Reserva')

  useEffect(() => {
    if (!reserva) navigate('/', { replace: true })
  }, [reserva, navigate])

  if (!reserva) return null

  const estado = ESTADOS[reserva.estado] || { label: reserva.estado || 'Registrada', variant: 'neutral' }
  const fechaValida = Boolean(reserva.fecha) && !Number.isNaN(new Date(reserva.fecha).getTime())
  const rutaInicio = tenant?.subdominio ? `/${tenant.subdominio}` : '/'
  const rutaReservar = tenant?.subdominio ? `/reservar?tenant=${encodeURIComponent(tenant.subdominio)}` : '/reservar'
  const fecha = fechaValida ? formatDateFromISO(reserva.fecha) : 'Fecha por confirmar'
  const hora = fechaValida ? formatTimeFromISO(reserva.fecha) : '—'

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {tenant ? (
        <TenantHeader
          tenant={tenant}
          actions={
            <Link
              to={rutaInicio}
              className="inline-flex h-9 items-center rounded-md border border-line bg-surface px-3 text-xs font-semibold text-ink-muted transition-colors hover:bg-graphite-50 hover:text-ink"
            >
              Inicio
            </Link>
          }
        />
      ) : (
        <header className="border-b border-line bg-surface">
          <div className="mx-auto flex max-w-3xl items-center px-4 py-4">
            <Link to="/" className="text-sm font-semibold text-ink">AgendaCar</Link>
          </div>
        </header>
      )}

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success-50 text-success-600">
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <p className="micro-label">Reserva registrada</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Tu hora está confirmada
            </h1>
            <p className="mt-1.5 text-sm text-ink-muted sm:text-base">
              {tenant ? `Te esperamos en ${tenant.nombre}.` : 'Tu reserva quedó registrada correctamente.'}
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink">Reserva #{reserva.id}</p>
              <p className="mt-0.5 text-xs text-ink-muted">Guarda este detalle para tu visita.</p>
            </div>
            <Badge variant={estado.variant} dot>{estado.label}</Badge>
          </div>

          <dl className="grid gap-x-8 gap-y-5 px-4 py-5 sm:grid-cols-2">
            <Dato
              icon={IconWrench}
              label="Servicio"
              value={reserva.servicio?.nombre || 'Servicio'}
              detail={reserva.servicio?.duracion ? `${reserva.servicio.duracion} minutos` : null}
            />
            <Dato icon={IconCalendarDot} label="Fecha" value={fecha} />
            <Dato icon={IconClockThin}   label="Hora"  value={hora} />
            <Dato icon={Car} label="Patente" value={reserva.patente} />
          </dl>

          <div className="flex flex-col gap-2 border-t border-line bg-graphite-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-ink-muted">
              Si necesitas cancelar o reagendar, contacta directamente al taller.
            </p>
            {tenant?.telefono && (
              <a
                href={`tel:${tenant.telefono.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink transition-colors hover:text-accent-600"
              >
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                {tenant.telefono}
              </a>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link
            to={rutaInicio}
            className={buttonClasses({ variant: 'dark', size: 'lg', className: 'w-full sm:w-auto' })}
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Volver al inicio
          </Link>
          <Link
            to={rutaReservar}
            state={{ tenant }}
            className={buttonClasses({ variant: 'secondary', size: 'lg', className: 'w-full sm:w-auto' })}
          >
            <CalendarPlus className="h-4 w-4" aria-hidden="true" />
            Reservar otra hora
          </Link>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-ink-soft">
          La reserva quedó registrada con los datos enviados al taller. Si alguno es incorrecto,
          comunícate con {tenant?.nombre || 'el taller'} para corregirlo.
        </p>
      </main>

      {tenant && <PublicFooter tenant={tenant} />}
    </div>
  )
}

function Dato({ icon: Icon, label, value, detail }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-graphite-100 text-graphite-500">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-soft">{label}</dt>
        <dd className="mt-0.5 text-sm font-semibold text-ink">{value}</dd>
        {detail && <p className="mt-0.5 text-xs text-ink-muted">{detail}</p>}
      </div>
    </div>
  )
}

