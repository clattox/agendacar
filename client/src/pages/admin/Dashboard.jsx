import { useCallback, useEffect, useState } from 'react'
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleSlash,
  Clock,
  RefreshCw,
  Wrench
} from 'lucide-react'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { formatLongDate, toDateKey } from '../../lib/dates'
import { getApiErrorMessage } from '../../lib/errors'
import { listarReservasPorFecha } from '../../services/reservasService'
import {
  obtenerDiasEstadisticas,
  obtenerResumenEstadisticas,
  obtenerServiciosEstadisticas
} from '../../services/estadisticasService'
import AdminLayout from '../../components/admin/AdminLayout'
import { Alert, Button, Skeleton } from '../../components/ui'

const MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
]

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export default function Dashboard() {
  const [reservasHoy, setReservasHoy] = useState([])
  const [porMes, setPorMes] = useState([])
  const [servicios, setServicios] = useState([])
  const [dias, setDias] = useState([])
  const [loadingHoy, setLoadingHoy] = useState(true)
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(true)
  const [errorHoy, setErrorHoy] = useState('')
  const [errorEstadisticas, setErrorEstadisticas] = useState('')
  const hoy = new Date()

  useDocumentTitle('Panel — AgendaCar')

  const cargarHoy = useCallback(async () => {
    setLoadingHoy(true)
    setErrorHoy('')
    try {
      const data = await listarReservasPorFecha(toDateKey(new Date()))
      setReservasHoy(Array.isArray(data) ? data : [])
    } catch (err) {
      setReservasHoy([])
      setErrorHoy(getApiErrorMessage(err, 'No pudimos cargar las reservas de hoy.'))
    } finally {
      setLoadingHoy(false)
    }
  }, [])

  const cargarEstadisticas = useCallback(async () => {
    setLoadingEstadisticas(true)
    setErrorEstadisticas('')
    try {
      const [resumen, respuestaServicios, respuestaDias] = await Promise.all([
        obtenerResumenEstadisticas(),
        obtenerServiciosEstadisticas(),
        obtenerDiasEstadisticas()
      ])

      setPorMes(Array.isArray(resumen?.porMes) ? resumen.porMes : [])
      setServicios(Array.isArray(respuestaServicios?.servicios) ? respuestaServicios.servicios : [])
      setDias(Array.isArray(respuestaDias?.dias) ? respuestaDias.dias : [])
    } catch (err) {
      setPorMes([])
      setServicios([])
      setDias([])
      setErrorEstadisticas(
        getApiErrorMessage(err, 'No pudimos cargar las estadísticas del taller.')
      )
    } finally {
      setLoadingEstadisticas(false)
    }
  }, [])

  const cargar = useCallback(() => {
    cargarHoy()
    cargarEstadisticas()
  }, [cargarHoy, cargarEstadisticas])

  useEffect(() => { cargar() }, [cargar])

  const confirmadas = reservasHoy.filter(reserva => reserva.estado === 'confirmada')
  const atendidas = reservasHoy.filter(reserva => reserva.estado === 'atendida')
  const canceladas = reservasHoy.filter(reserva => reserva.estado === 'cancelada')

  const diasSemana = [1, 2, 3, 4, 5, 6].map(diaSemana => {
    const encontrado = dias.find(item => Number(item.diaSemana) === diaSemana)
    return {
      label: encontrado?.label || DIAS_SEMANA[diaSemana],
      total: Number(encontrado?.total) || 0
    }
  })

  const errores = [errorHoy, errorEstadisticas].filter(Boolean)

  return (
    <AdminLayout>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="micro-label">Resumen del día</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">
            {formatLongDate(hoy)}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Estado de la agenda y estadísticas de los últimos meses.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={RefreshCw}
          onClick={cargar}
          disabled={loadingHoy || loadingEstadisticas}
        >
          Actualizar
        </Button>
      </header>

      {errores.length > 0 && (
        <Alert
          variant="error"
          className="mt-5"
          onDismiss={() => {
            setErrorHoy('')
            setErrorEstadisticas('')
          }}
        >
          {errores.join(' ')}
        </Alert>
      )}

      <section
        className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
        aria-label="Resumen del día"
      >
        <MetricCard
          icon={Clock}
          label="Confirmadas"
          value={confirmadas.length}
          detail="Pendientes de atención"
          tone="accent"
          loading={loadingHoy}
        />
        <MetricCard
          icon={CheckCircle2}
          label="Atendidas"
          value={atendidas.length}
          detail="Completadas hoy"
          tone="success"
          loading={loadingHoy}
        />
        <MetricCard
          icon={CalendarDays}
          label="Total del día"
          value={reservasHoy.length}
          detail="Todas las reservas"
          tone="neutral"
          loading={loadingHoy}
        />
        <MetricCard
          icon={CircleSlash}
          label="Canceladas"
          value={canceladas.length}
          detail="No se presentaron"
          tone="muted"
          loading={loadingHoy}
        />
      </section>

      <Panel
        className="mt-6"
        title="Reservas últimos 6 meses"
        description="Total de reservas registradas por mes."
        icon={BarChart3}
      >
        <ReservasPorMesChart
          datos={porMes}
          loading={loadingEstadisticas}
          error={errorEstadisticas}
        />
      </Panel>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <RankingPanel
          title="Servicios más solicitados"
          description="Top 5 de servicios por cantidad de reservas."
          icon={Wrench}
          items={servicios.map(servicio => ({
            label: servicio.nombre,
            total: servicio.total
          }))}
          loading={loadingEstadisticas}
          error={errorEstadisticas}
          barClassName="bg-accent-400"
          emptyDescription="Aún no hay reservas asociadas a servicios."
        />
        <RankingPanel
          title="Días más ocupados"
          description="Distribución de reservas de lunes a sábado."
          icon={CalendarDays}
          items={diasSemana}
          loading={loadingEstadisticas}
          error={errorEstadisticas}
          barClassName="bg-graphite-700"
          emptyDescription="Aún no hay reservas registradas en la semana."
        />
      </div>
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

function Panel({ title, description, icon: Icon, className = '', children }) {
  return (
    <section className={`rounded-xl border border-line bg-surface shadow-card ${className}`}>
      <div className="flex items-start gap-3 border-b border-line px-4 py-3">
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-accent-50 text-accent-600">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function RankingPanel({
  title,
  description,
  icon,
  items,
  loading,
  error,
  barClassName,
  emptyDescription
}) {
  const datos = Array.isArray(items) ? items : []
  const maximo = Math.max(...datos.map(item => Number(item.total) || 0), 0)

  return (
    <Panel title={title} description={description} icon={icon}>
      {loading ? (
        <RankingSkeleton />
      ) : error ? (
        <PanelMensaje
          icon={icon}
          title="No pudimos cargar las estadísticas"
          description="Intenta actualizar el panel en unos segundos."
        />
      ) : datos.length === 0 || maximo === 0 ? (
        <PanelMensaje
          icon={icon}
          title="Sin datos suficientes"
          description={emptyDescription}
        />
      ) : (
        <ul className="space-y-4">
          {datos.map((item, index) => {
            const total = Number(item.total) || 0
            const porcentaje = maximo > 0 ? Math.round((total / maximo) * 100) : 0

            return (
              <li key={`${item.label}-${index}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-medium text-ink">{item.label}</span>
                  <span className="shrink-0 text-xs font-semibold font-tabular text-ink-muted">
                    {total}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-graphite-100">
                  <div
                    className={`h-full rounded-full transition-[width] duration-300 ${barClassName}`}
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}

function RankingSkeleton() {
  return (
    <ul className="space-y-4" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <li key={index}>
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-6" />
          </div>
          <Skeleton className="mt-2 h-2 w-full" />
        </li>
      ))}
    </ul>
  )
}

function PanelMensaje({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-graphite-100 text-graphite-500">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>}
    </div>
  )
}

function ReservasPorMesChart({ datos, loading, error }) {
  const [hover, setHover] = useState(null)

  if (loading) return <ChartSkeleton />
  if (error) {
    return (
      <PanelMensaje
        icon={BarChart3}
        title="No pudimos cargar las estadísticas"
        description="Intenta actualizar el panel en unos segundos."
      />
    )
  }

  const serie = Array.isArray(datos) ? datos : []
  const valores = serie.map(item => Number(item.total) || 0)
  const maximo = Math.max(...valores, 0)

  if (serie.length === 0 || maximo === 0) {
    return (
      <PanelMensaje
        icon={BarChart3}
        title="Sin datos suficientes"
        description="Aún no hay reservas registradas en los últimos 6 meses."
      />
    )
  }

  const ancho = 640
  const alto = 280
  const margen = { top: 24, right: 16, bottom: 40, left: 40 }
  const anchoPlot = ancho - margen.left - margen.right
  const altoPlot = alto - margen.top - margen.bottom
  const { escala, paso } = calcularEscala(maximo)
  const ticks = Array.from({ length: 5 }, (_, index) => index * paso)
  const anchoBanda = anchoPlot / serie.length
  const anchoBarra = Math.min(44, anchoBanda * 0.52)

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${ancho} ${alto}`}
        className="h-auto w-full min-w-[480px]"
        role="img"
        aria-label="Gráfico de barras de reservas de los últimos 6 meses"
      >
        {ticks.map(valor => {
          const y = margen.top + altoPlot - (valor / escala) * altoPlot
          return (
            <g key={valor}>
              <line
                x1={margen.left}
                x2={ancho - margen.right}
                y1={y}
                y2={y}
                stroke="#E1E3E6"
                strokeDasharray={valor === 0 ? undefined : '4 4'}
              />
              <text
                x={margen.left - 8}
                y={y + 3.5}
                textAnchor="end"
                fontSize="10"
                fill="#8C939D"
              >
                {valor}
              </text>
            </g>
          )
        })}

        {serie.map((item, index) => {
          const total = Number(item.total) || 0
          const alturaBarra = (total / escala) * altoPlot
          const x = margen.left + index * anchoBanda + (anchoBanda - anchoBarra) / 2
          const y = margen.top + altoPlot - alturaBarra
          const centro = x + anchoBarra / 2
          const etiqueta = etiquetaMes(item.mes)
          const etiquetaLarga = etiquetaMesLarga(item.mes)
          const activo = hover === index
          const tooltipAncho = Math.max(72, String(total).length * 7 + 42)
          const tooltipX = Math.min(
            Math.max(centro - tooltipAncho / 2, margen.left),
            ancho - margen.right - tooltipAncho
          )
          const tooltipY = Math.max(4, y - 30)

          return (
            <g
              key={item.mes}
              onMouseEnter={() => setHover(index)}
              onMouseLeave={() => setHover(null)}
              className="cursor-default"
            >
              <rect
                x={margen.left + index * anchoBanda}
                y={margen.top}
                width={anchoBanda}
                height={altoPlot}
                fill="transparent"
              />
              <rect
                x={x}
                y={y}
                width={anchoBarra}
                height={total > 0 ? Math.max(alturaBarra, 2) : 0}
                rx="4"
                fill="#F47732"
                opacity={hover === null || activo ? 1 : 0.5}
              />
              {activo && (
                <g pointerEvents="none">
                  <rect
                    x={tooltipX}
                    y={tooltipY}
                    width={tooltipAncho}
                    height={22}
                    rx="5"
                    fill="#24272B"
                  />
                  <text
                    x={tooltipX + tooltipAncho / 2}
                    y={tooltipY + 15}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="11"
                    fontWeight="600"
                  >
                    {total} {total === 1 ? 'reserva' : 'reservas'}
                  </text>
                </g>
              )}
              <text
                x={centro}
                y={alto - 14}
                textAnchor="middle"
                fontSize="11"
                fill="#69717B"
              >
                {etiqueta}
              </text>
              <title>
                {`${etiquetaLarga}: ${total} ${total === 1 ? 'reserva' : 'reservas'}`}
              </title>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="flex h-56 items-end gap-3">
        {['h-24', 'h-36', 'h-20', 'h-44', 'h-28', 'h-40'].map((altura, index) => (
          <Skeleton key={index} className={`flex-1 ${altura}`} />
        ))}
      </div>
      <div className="flex justify-between gap-3 px-1">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-3 w-8" />
        ))}
      </div>
    </div>
  )
}

function calcularEscala(maximo) {
  const divisiones = 4
  const bruto = maximo / divisiones
  const magnitud = 10 ** Math.floor(Math.log10(bruto))
  const paso = Math.max(1, Math.ceil(bruto / magnitud) * magnitud)

  return { escala: paso * divisiones, paso }
}

function etiquetaMes(mes) {
  const numero = Number(String(mes).split('-')[1])
  return MESES_CORTOS[numero - 1] || String(mes)
}

function etiquetaMesLarga(mes) {
  const [anio, numero] = String(mes).split('-')
  const nombre = MESES_CORTOS[Number(numero) - 1]
  return nombre ? `${nombre} ${anio}` : String(mes)
}
