import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  Mail,
  Phone,
  RefreshCw
} from 'lucide-react'
import {
  IconCalendarDot,
  IconCheckRing,
  IconClockThin,
  IconWrench,
} from '../../components/public/FeatureIcons'
import useTenant from '../../hooks/useTenant'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { listarServicios } from '../../services/serviciosService'
import { listarHorarios } from '../../services/horariosService'
import { getApiErrorMessage } from '../../lib/errors'
import { getTenantFromQuery } from '../../lib/tenant'
import { DIAS_SEMANA } from '../../lib/dates'
import TenantHeader from '../../components/public/TenantHeader'
import PublicFooter from '../../components/public/PublicFooter'
import { Alert, Button, EmptyState, SkeletonText } from '../../components/ui'

const PASOS = [
  { icon: IconWrench,      title: 'Elige el servicio', detail: 'Según lo que necesita tu vehículo' },
  { icon: IconCalendarDot, title: 'Fecha y hora',       detail: 'Solo horarios disponibles' },
  { icon: IconCheckRing,   title: 'Confirma',           detail: 'Recibe el detalle de tu cita' },
]

export default function Inicio({ slugOverride = null }) {
  const navigate = useNavigate()
  const { tenant, loading, error, recargar } = useTenant(null, slugOverride)
  const [servicios, setServicios] = useState([])
  const [horarios, setHorarios] = useState([])
  const [datosLoading, setDatosLoading] = useState(true)
  const [serviciosError, setServiciosError] = useState('')
  const [horariosError, setHorariosError] = useState('')
  const [recargaDatos, setRecargaDatos] = useState(0)

  useDocumentTitle(tenant ? `${tenant.nombre} — Reserva tu hora` : 'AgendaCar')

  useEffect(() => {
    if (!tenant?.id) return

    let activo = true
    setDatosLoading(true)
    setServiciosError('')
    setHorariosError('')

    Promise.allSettled([
      listarServicios(tenant.id),
      listarHorarios(tenant.id)
    ]).then(([serviciosResult, horariosResult]) => {
      if (!activo) return

      if (serviciosResult.status === 'fulfilled') {
        setServicios(serviciosResult.value)
      } else {
        setServicios([])
        setServiciosError(getApiErrorMessage(serviciosResult.reason, 'No pudimos cargar los servicios.'))
      }

      if (horariosResult.status === 'fulfilled') {
        setHorarios(horariosResult.value)
      } else {
        setHorarios([])
        setHorariosError('No pudimos cargar los horarios de atención.')
      }
    }).finally(() => {
      if (activo) setDatosLoading(false)
    })

    return () => { activo = false }
  }, [tenant?.id, recargaDatos])

  // Conserva el slug al navegar a reservar (slug limpio > ?tenant= > sin parámetro).
  const tenantQuery = getTenantFromQuery()
  const slugActivo = slugOverride || tenantQuery
  const rutaReservar = slugActivo
    ? `/reservar?tenant=${encodeURIComponent(slugActivo)}`
    : '/reservar'

  const reservar = servicioId => navigate(rutaReservar, {
    state: servicioId ? { tenant, servicioId } : { tenant }
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="border-b border-line bg-surface">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
            <div className="h-11 w-11 animate-pulse rounded-lg bg-graphite-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 animate-pulse rounded bg-graphite-100" />
              <div className="h-2.5 w-28 animate-pulse rounded bg-graphite-100" />
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-3xl px-4 py-12">
          <div className="h-3 w-24 animate-pulse rounded bg-graphite-100" />
          <div className="mt-4 h-9 w-3/4 animate-pulse rounded bg-graphite-100" />
          <div className="mt-3 h-9 w-2/3 animate-pulse rounded bg-graphite-100" />
          <SkeletonText lines={3} className="mt-6 max-w-md" />
        </div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <div className="w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-card">
          <EmptyState
            icon={Building2}
            title="Taller no disponible"
            description={error || 'No encontramos información para este taller. Revisa la dirección e intenta nuevamente.'}
            action={
              <Button variant="secondary" leftIcon={RefreshCw} onClick={recargar}>
                Reintentar
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  const horariosOrdenados = [...horarios].sort((a, b) => a.diaSemana - b.diaSemana)

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <TenantHeader
        tenant={tenant}
        actions={
          <Link
            to="/admin/login"
            className="hidden h-9 items-center rounded-md border border-line bg-surface px-3 text-xs font-semibold text-ink-muted transition-colors hover:bg-graphite-50 hover:text-ink sm:inline-flex"
          >
            Acceso taller
          </Link>
        }
      />
      <main className="flex-1">
        <section className="mx-auto w-full max-w-3xl px-4 pt-6 sm:pt-8">
          <div className="rounded-xl bg-graphite-900 p-6 sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10">
              <div className="min-w-0">
                <span className="micro-label inline-flex items-center gap-2 text-graphite-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-400" aria-hidden="true" />
                  Reserva online
                </span>

                <h1 className="mt-3 break-words text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
                  Agenda tu hora en{' '}
                  <span className="text-accent-400">{tenant.nombre}</span>
                </h1>
                <p className="mt-3 max-w-lg text-base leading-relaxed text-graphite-300">
                  Elige el servicio, revisa la disponibilidad del taller y confirma tu cita en pocos pasos.
                </p>

                <div className="mt-7 flex flex-col gap-2 sm:flex-row">
                  <Button
                    size="lg"
                    rightIcon={ArrowRight}
                    className="w-full whitespace-nowrap sm:w-auto"
                    onClick={() => reservar()}
                  >
                    Reservar hora
                  </Button>
                  {tenant.telefono && (
                    <a
                      href={`tel:${tenant.telefono.replace(/\s+/g, '')}`}
                      className="focus-ring inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-md border border-white/25 bg-white/5 px-5 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/10 sm:w-auto"
                    >
                      <Phone className="h-4 w-4" aria-hidden="true" />
                      Llamar al taller
                    </a>
                  )}
                </div>

                <div className="mt-9 grid grid-cols-1 sm:grid-cols-3">
                  {PASOS.map(({ icon: Icon, title, detail }, index) => (
                    <div
                      key={title}
                      className="border-t border-white/10 py-4 first:border-t-0 first:pt-0 sm:border-l sm:border-t-0 sm:px-4 sm:py-0 sm:first:border-l-0 sm:first:pl-0"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-accent-400" aria-hidden="true" />
                        <span className="font-tabular text-[11px] font-semibold text-graphite-400">
                          0{index + 1}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-semibold text-white">{title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-graphite-300">{detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="min-w-0 rounded-lg border border-white/10 bg-graphite-50 p-5">
                <p className="micro-label">Datos del taller</p>

                <dl className="mt-3 space-y-2.5 text-sm">
                  {tenant.telefono && (
                    <div className="flex items-start gap-2.5">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-graphite-400" aria-hidden="true" />
                      <div>
                        <dt className="text-xs text-ink-muted">Teléfono</dt>
                        <dd>
                          <a
                            href={`tel:${tenant.telefono.replace(/\s+/g, '')}`}
                            className="font-medium text-ink transition-colors hover:text-accent-600"
                          >
                            {tenant.telefono}
                          </a>
                        </dd>
                      </div>
                    </div>
                  )}
                  {tenant.email && (
                    <div className="flex items-start gap-2.5">
                      <Mail className="mt-0.5 h-4 w-4 shrink-0 text-graphite-400" aria-hidden="true" />
                      <div className="min-w-0">
                        <dt className="text-xs text-ink-muted">Email</dt>
                        <dd className="truncate">
                          <a
                            href={`mailto:${tenant.email}`}
                            className="font-medium text-ink transition-colors hover:text-accent-600"
                          >
                            {tenant.email}
                          </a>
                        </dd>
                      </div>
                    </div>
                  )}
                </dl>

                <div className="mt-5 border-t border-line pt-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-graphite-400" aria-hidden="true" />
                    <p className="micro-label">Horario de atención</p>
                  </div>

                  {datosLoading ? (
                    <SkeletonText lines={4} className="mt-3" />
                  ) : horariosError ? (
                    <p className="mt-2 text-xs leading-relaxed text-ink-muted">{horariosError}</p>
                  ) : horariosOrdenados.length === 0 ? (
                    <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                      El taller aún no tiene horarios publicados.
                    </p>
                  ) : (
                    <ul className="mt-2.5 space-y-1.5">
                      {horariosOrdenados.map(horario => (
                        <li
                          key={`${horario.diaSemana}-${horario.horaInicio}-${horario.horaFin}`}
                          className="flex items-center justify-between gap-3 text-xs"
                        >
                          <span className="text-ink-muted">{DIAS_SEMANA[horario.diaSemana]}</span>
                          <span className="font-tabular font-medium text-ink">
                            {horario.horaInicio} – {horario.horaFin}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="micro-label">Servicios</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink">
                Qué puedes reservar
              </h2>
            </div>
            {servicios.length > 0 && (
              <Button variant="secondary" size="sm" onClick={() => reservar()}>
                Ver disponibilidad
              </Button>
            )}
          </div>

          {datosLoading ? (
            <div className="space-y-1 rounded-xl border border-line bg-surface p-4">
              {[0, 1, 2].map(item => (
                <div key={item} className="flex items-center justify-between py-3">
                  <div className="w-1/2 space-y-2">
                    <div className="h-3 animate-pulse rounded bg-graphite-100" />
                    <div className="h-2.5 w-1/2 animate-pulse rounded bg-graphite-100" />
                  </div>
                  <div className="h-3 w-16 animate-pulse rounded bg-graphite-100" />
                </div>
              ))}
            </div>
          ) : serviciosError ? (
            <Alert variant="error" title="No pudimos cargar los servicios">
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <span>{serviciosError}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={RefreshCw}
                  onClick={() => setRecargaDatos(value => value + 1)}
                >
                  Reintentar
                </Button>
              </div>
            </Alert>
          ) : servicios.length === 0 ? (
            <EmptyState
              icon={IconWrench}
              title="Servicios no publicados"
              description="El taller todavía no tiene servicios disponibles para reservar en línea."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {servicios.map(servicio => (
                <article
                  key={servicio.id}
                  className="flex flex-col rounded-xl border border-line bg-surface p-4 shadow-card"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-700">
                      <IconWrench className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold leading-snug text-ink">
                        {servicio.nombre}
                      </h3>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-ink-muted">
                        <IconClockThin className="h-3.5 w-3.5" aria-hidden="true" />
                        Duración estimada: {servicio.duracion} min
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-4 w-full"
                    rightIcon={ArrowRight}
                    onClick={() => reservar(servicio.id)}
                  >
                    Reservar
                  </Button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <PublicFooter tenant={tenant} />
    </div>
  )
}

