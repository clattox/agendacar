import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  Mail,
  Phone,
  RefreshCw,
  UtensilsCrossed,
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

const BG_POR_CATEGORIA = {
  generica:       '/bg-generica.jpg',
  mecanica:       '/bg-mecanica.jpg',
  electromecanica:'/bg-electromecanica.jpg',
  pintura:        '/bg-pintura.jpg',
  serviteca:      '/bg-serviteca.jpg',
}

/** Devuelve el icono SVG/imagen correspondiente al nombre del servicio */
function ServicioIcon({ nombre }) {
  const lower = (nombre ?? '').toLowerCase()
  let src = null
  let isPhoto = false

  if (/neumátic|neumatic|montaje|desmontaje/.test(lower)) {
    src = '/assets/neumatico.png'; isPhoto = true
  } else if (/aceite|filtro/.test(lower)) {
    src = '/assets/cambio-aceite.svg'
  } else if (/freno/.test(lower)) {
    src = '/assets/frenos.svg'
  } else if (/alineac|balanceo/.test(lower)) {
    src = '/assets/alineacion-balanceo.svg'
  } else if (/diagnóst|diagnost/.test(lower)) {
    src = '/assets/diagnostico.svg'
  } else if (/revisión|revision/.test(lower)) {
    src = '/assets/revision-general.svg'
  }

  if (src) {
    return (
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className={isPhoto ? 'h-9 w-9 object-contain' : 'h-8 w-8'}
      />
    )
  }
  return <IconWrench className="h-5 w-5 text-accent-700" aria-hidden="true" />
}

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

  // Personalización visual del taller
  const bgUrl   = BG_POR_CATEGORIA[tenant?.categoria] || BG_POR_CATEGORIA.generica
  const acento  = tenant?.colorPrimario || '#f59e0b'

  // Agrupa horarios: lunes–viernes en un bloque si todos comparten exactamente el mismo horario
  const bloqueHorarios = (() => {
    const activos = horariosOrdenados.filter(h => h.activo !== false)
    const semana = activos.filter(h => h.diaSemana >= 1 && h.diaSemana <= 5)
    const sabado = activos.find(h => h.diaSemana === 6) || null
    const resto  = activos.filter(h => h.diaSemana === 0) // domingo u otros

    const bloques = []

    if (semana.length > 0) {
      const primero = semana[0]
      const todoIgual = semana.every(
        h =>
          h.horaInicio     === primero.horaInicio &&
          h.horaFin        === primero.horaFin &&
          (h.inicioColacion ?? null) === (primero.inicioColacion ?? null) &&
          (h.finColacion   ?? null) === (primero.finColacion   ?? null)
      )
      if (todoIgual && semana.length === 5) {
        // Bloque unificado lunes–viernes
        bloques.push({ label: 'Lunes a viernes', horario: primero })
      } else {
        // Días individuales
        semana.forEach(h => bloques.push({ label: DIAS_SEMANA[h.diaSemana], horario: h }))
      }
    }

    if (sabado) {
      // Sábado: se muestra solo el horario de atención, sin colación (ajuste visual, no modifica BD)
      bloques.push({ label: DIAS_SEMANA[6], horario: sabado, ocultarColacion: true })
    }

    // Domingo (raro, pero por si acaso)
    resto.forEach(h => bloques.push({ label: DIAS_SEMANA[h.diaSemana], horario: h }))

    return bloques
  })()

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
          <div className="relative overflow-hidden rounded-xl">
            {/* Fotografía de fondo del hero (por categoría de taller) */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${bgUrl})`, backgroundPosition: 'center 40%' }}
              aria-hidden="true"
            />
            {/* Capa de contraste: más oscura a la izquierda donde está el texto */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to right, rgba(36,39,43,0.93) 0%, rgba(36,39,43,0.80) 55%, rgba(36,39,43,0.55) 100%)'
              }}
              aria-hidden="true"
            />
            {/* Gradiente vertical en móvil para que el texto sea legible al apilar columnas */}
            <div
              className="absolute inset-0 lg:hidden"
              style={{ background: 'linear-gradient(to bottom, rgba(36,39,43,0.20) 0%, rgba(36,39,43,0.10) 100%)' }}
              aria-hidden="true"
            />
            <div className="relative z-10 p-6 sm:p-8 lg:p-10">
            <div className="grid gap-6 md:grid-cols-[1fr_240px] md:gap-6 lg:grid-cols-[1fr_250px] lg:gap-8">
              <div className="min-w-0 max-w-lg">
                <span className="micro-label inline-flex items-center gap-2 text-graphite-300">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: acento }} aria-hidden="true" />
                  Reserva online
                </span>

                <h1 className="mt-3 break-words text-3xl font-bold leading-snug tracking-tight text-white sm:text-4xl">
                  Agenda tu hora en{' '}
                  <span className="relative inline-block" style={{ color: acento }}>
                    {tenant.nombre}
                    <span
                      className="absolute -bottom-0.5 left-0 h-0.5 w-full rounded-full opacity-40"
                      style={{ backgroundColor: acento }}
                      aria-hidden="true"
                    />
                  </span>
                </h1>
                <p className="mt-3 text-base leading-relaxed text-graphite-200">
                  Elige el servicio, revisa la disponibilidad del taller y confirma tu cita en pocos pasos.
                </p>

                <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-start">
                  <Button
                    size="lg"
                    rightIcon={ArrowRight}
                    className="whitespace-nowrap"
                    onClick={() => reservar()}
                  >
                    Reservar hora
                  </Button>
                  {tenant.telefono && (
                    <a
                      href={`tel:${tenant.telefono.replace(/\s+/g, '')}`}
                      className="focus-ring inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-white/25 bg-white/5 px-5 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/10"
                    >
                      <Phone className="h-4 w-4" aria-hidden="true" />
                      Llamar al taller
                    </a>
                  )}
                </div>

                <div className="mt-8 grid grid-cols-1 gap-y-3 sm:grid-cols-3 sm:gap-y-0">
                  {PASOS.map(({ icon: Icon, title, detail }, index) => (
                    <div
                      key={title}
                      className="rounded-md border-t border-white/10 py-3.5 first:border-t-0 first:pt-0 sm:border-l sm:border-t-0 sm:px-4 sm:py-0 sm:first:border-l-0 sm:first:pl-0"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" style={{ color: acento }} aria-hidden="true" />
                        <span className="font-tabular text-[11px] font-semibold text-graphite-400">
                          0{index + 1}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-semibold leading-snug text-white">{title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-graphite-300">{detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="min-w-0 self-start rounded-lg border border-[#E1E3E6] bg-white p-4 shadow-sm">
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
                    <IconClockThin className="h-4 w-4 text-graphite-400" aria-hidden="true" />
                    <p className="micro-label">Horario de atención</p>
                  </div>

                  {datosLoading ? (
                    <SkeletonText lines={4} className="mt-3" />
                  ) : horariosError ? (
                    <p className="mt-2 text-xs leading-relaxed text-ink-muted">{horariosError}</p>
                  ) : bloqueHorarios.length === 0 ? (
                    <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                      El taller aún no tiene horarios publicados.
                    </p>
                  ) : (
                    <ul className="mt-2.5 space-y-2">
                      {bloqueHorarios.map(({ label, horario, ocultarColacion }, idx) => (
                        <li key={`${label}-${idx}`} className="text-xs">
                          <div className="flex items-baseline gap-2">
                            <span className="w-24 shrink-0 text-ink-muted">{label}</span>
                            <span className="font-tabular font-medium text-ink tabular-nums">
                              {horario.horaInicio} – {horario.horaFin}
                            </span>
                          </div>
                          {!ocultarColacion && horario.inicioColacion && horario.finColacion && (
                            <div className="mt-0.5 flex items-center justify-end gap-1 text-accent-500">
                              <UtensilsCrossed className="h-3 w-3 shrink-0" aria-hidden="true" />
                              <span className="font-tabular tabular-nums text-ink-muted">
                                {horario.inicioColacion} – {horario.finColacion}
                              </span>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </aside>
            </div>
            </div>{/* /relative z-10 */}
          </div>{/* /relative overflow-hidden */}
        </section>

        <section className="mx-auto max-w-3xl px-4 py-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="h-6 w-0.5 rounded-full" style={{ backgroundColor: acento }} aria-hidden="true" />
              <div>
                <p className="micro-label">Servicios</p>
                <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-ink">
                  Qué puedes reservar
                </h2>
              </div>
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
                  className="group flex flex-col rounded-xl border border-line bg-surface p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-200 hover:shadow-lg"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-50 transition-colors duration-200 group-hover:bg-accent-100">
                      <ServicioIcon nombre={servicio.nombre} />
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

