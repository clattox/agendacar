import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
  Wrench
} from 'lucide-react'
import useTenant from '../../hooks/useTenant'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { listarServicios } from '../../services/serviciosService'
import { listarHorarios } from '../../services/horariosService'
import { crearReserva, listarHorasDisponibles } from '../../services/reservasService'
import { getApiErrorMessage } from '../../lib/errors'
import { getTenantFromQuery } from '../../lib/tenant'
import {
  DIAS_CORTOS,
  formatLongDate,
  formatMonthYear,
  fromDateKey,
  getDateKeyInTimeZone,
  getTimeInMinutesInTimeZone,
  toDateKey
} from '../../lib/dates'
import TenantHeader from '../../components/public/TenantHeader'
import PublicFooter from '../../components/public/PublicFooter'
import StepIndicator, { PASOS_RESERVA } from '../../components/public/StepIndicator'
import { Alert, Button, EmptyState, FormField, Input } from '../../components/ui'

const TITULOS = {
  1: 'Elige el servicio',
  2: 'Elige fecha y hora',
  3: 'Tus datos',
  4: 'Confirma tu reserva'
}

const SUBTITULOS = {
  1: '¿Qué necesita tu vehículo?',
  2: 'Selecciona el día y uno de los horarios disponibles.',
  3: 'Usaremos estos datos para identificar y contactar tu reserva.',
  4: 'Revisa que todo esté correcto antes de enviar la reserva al taller.'
}

const CAMPOS = ['nombre', 'telefono', 'email', 'patente']

// Marcas comunes en Chile con sus modelos principales
const MARCAS_MODELOS = {
  'Chevrolet': ['Spark', 'Sail', 'Aveo', 'Cruze', 'Tracker', 'Captiva', 'S10', 'D-Max', 'Silverado', 'Blazer', 'Equinox', 'Trax', 'Onix'],
  'Citroën': ['C3', 'C4', 'C5', 'C-Elysée', 'Berlingo', 'Jumpy', 'Jumper', 'Picasso'],
  'Ford': ['Fiesta', 'Focus', 'Fusion', 'Escape', 'Explorer', 'Ranger', 'F-150', 'EcoSport', 'Maverick', 'Bronco', 'Puma'],
  'Honda': ['City', 'Civic', 'Accord', 'CR-V', 'HR-V', 'Pilot', 'Fit', 'Jazz', 'WR-V'],
  'Hyundai': ['Accent', 'Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Creta', 'Kona', 'Ioniq', 'i10', 'i20', 'i30'],
  'Kia': ['Picanto', 'Rio', 'Cerato', 'Optima', 'Sportage', 'Sorento', 'Seltos', 'Stonic', 'Stinger', 'Soul', 'EV6'],
  'Mazda': ['2', '3', '6', 'CX-3', 'CX-30', 'CX-5', 'CX-9', 'BT-50', 'MX-5'],
  'Mercedes-Benz': ['Clase A', 'Clase B', 'Clase C', 'Clase E', 'Clase S', 'GLA', 'GLC', 'GLE', 'GLS', 'Sprinter', 'Vito'],
  'Mitsubishi': ['Lancer', 'Eclipse Cross', 'ASX', 'Outlander', 'L200', 'Montero', 'Galant'],
  'Nissan': ['March', 'Tiida', 'Sentra', 'Altima', 'X-Trail', 'Qashqai', 'Kicks', 'Frontier', 'Patrol', 'Navara', 'Leaf'],
  'Peugeot': ['208', '308', '408', '2008', '3008', '5008', 'Partner', 'Expert', 'Boxer'],
  'Renault': ['Clio', 'Megane', 'Fluence', 'Sandero', 'Duster', 'Captur', 'Koleos', 'Oroch', 'Kangoo', 'Master'],
  'Subaru': ['Impreza', 'Forester', 'Outback', 'XV', 'Legacy', 'BRZ', 'WRX'],
  'Suzuki': ['Swift', 'Baleno', 'Vitara', 'S-Cross', 'Jimny', 'Grand Vitara', 'APV'],
  'Toyota': ['Yaris', 'Corolla', 'Camry', 'Hilux', 'Land Cruiser', 'RAV4', 'C-HR', 'Fortuner', 'Prado', 'Prius', 'SW4'],
  'Volkswagen': ['Polo', 'Golf', 'Jetta', 'Passat', 'Tiguan', 'Touareg', 'T-Cross', 'Taos', 'Amarok', 'Transporter'],
  'Volvo': ['S60', 'S90', 'V60', 'V90', 'XC40', 'XC60', 'XC90'],
  'BMW': ['Serie 1', 'Serie 2', 'Serie 3', 'Serie 4', 'Serie 5', 'X1', 'X2', 'X3', 'X5', 'X6', 'X7'],
  'Audi': ['A1', 'A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7', 'Q8', 'TT'],
  'Jeep': ['Compass', 'Cherokee', 'Grand Cherokee', 'Renegade', 'Wrangler', 'Gladiator'],
  'Fiat': ['500', 'Argo', 'Cronos', 'Pulse', 'Fastback', 'Ducato', 'Strada'],
  'Otro': []
}

const MARCAS = Object.keys(MARCAS_MODELOS).sort((a, b) => a.localeCompare(b, 'es'))

function minutosDeHora(hora) {
  const [horas, minutos] = String(hora).split(':').map(Number)
  return horas * 60 + minutos
}

function ultimoSlotDeHorario(horario, duracion) {
  if (!horario || !duracion || duracion <= 0) return null

  const inicio = minutosDeHora(horario.horaInicio)
  const fin = minutosDeHora(horario.horaFin)
  if (!Number.isFinite(inicio) || !Number.isFinite(fin) || inicio + duracion > fin) return null

  return inicio + Math.floor((fin - inicio - duracion) / duracion) * duracion
}

// Oculta los horarios que ya comenzaron cuando la fecha elegida es hoy.
function filtrarHorasVigentes(horas, fechaKey, referencia = new Date()) {
  if (!fechaKey || fechaKey !== getDateKeyInTimeZone(referencia)) return horas

  const minutosActuales = getTimeInMinutesInTimeZone(referencia)
  return horas.filter(hora => minutosDeHora(hora) > minutosActuales)
}

function validarCampo(campo, valor) {
  const texto = String(valor || '').trim()

  if (campo === 'nombre') {
    if (!texto) return 'Ingresa tu nombre completo.'
    if (texto.length < 3) return 'El nombre debe tener al menos 3 caracteres.'
  }

  if (campo === 'telefono') {
    if (!texto) return 'Ingresa un teléfono de contacto.'
    if (texto.replace(/\D/g, '').length < 8) return 'Ingresa un teléfono válido (mínimo 8 dígitos).'
  }

  if (campo === 'email' && texto) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto)) return 'Ingresa un email válido.'
  }

  if (campo === 'patente') {
    if (!texto) return 'Ingresa la patente del vehículo.'
    if (texto.replace(/[^A-Za-z0-9]/g, '').length < 4) return 'Ingresa una patente válida.'
  }

  return ''
}

function validarFormulario(form) {
  return CAMPOS.reduce((errores, campo) => {
    const mensaje = validarCampo(campo, form[campo])
    if (mensaje) errores[campo] = mensaje
    return errores
  }, {})
}

export default function Reservar() {
  const { state } = useLocation()
  const navigate = useNavigate()

  const tenantQuery = getTenantFromQuery()
  const rutaInicio = tenantQuery
    ? `/?tenant=${encodeURIComponent(tenantQuery)}`
    : '/'

  const tenantInicial = state?.tenant || null
  const servicioIdInicial = state?.servicioId ?? null
  const { tenant, loading: cargandoTenant, error: tenantError, recargar: recargarTenant } = useTenant(tenantInicial)

  const [paso, setPaso] = useState(1)
  const [servicios, setServicios] = useState([])
  const [cargandoServicios, setCargandoServicios] = useState(true)
  const [serviciosError, setServiciosError] = useState('')
  const [recargaServicios, setRecargaServicios] = useState(0)

  const [servicioSeleccionado, setServicioSeleccionado] = useState(null)
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null)
  const [horaSeleccionada, setHoraSeleccionada] = useState(null)
  const [horasDisponibles, setHorasDisponibles] = useState([])
  const [cargandoHoras, setCargandoHoras] = useState(false)
  const [horasError, setHorasError] = useState('')
  const [recargaHoras, setRecargaHoras] = useState(0)
  const [horarios, setHorarios] = useState(null)
  const [ahora, setAhora] = useState(() => new Date())
  const [mesActual, setMesActual] = useState(() => {
    const hoy = fromDateKey(getDateKeyInTimeZone())
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  })

  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    patente: '',
    kilometraje: '',
    marca: '',
    modelo: '',
    anio: '',
    observaciones: ''
  })
  const [errores, setErrores] = useState({})
  const [errorEnvio, setErrorEnvio] = useState('')
  const [enviando, setEnviando] = useState(false)

  const preseleccionAplicada = useRef(false)

  useDocumentTitle(tenant ? `Reservar hora — ${tenant.nombre}` : 'Reservar hora')

  useEffect(() => {
    const intervalo = window.setInterval(() => setAhora(new Date()), 30_000)
    return () => window.clearInterval(intervalo)
  }, [])

  useEffect(() => {
    if (!tenant?.id) {
      setHorarios(null)
      return
    }

    let activo = true
    setHorarios(null)

    listarHorarios(tenant.id)
      .then(data => {
        if (activo) setHorarios(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        // Si no se pudo leer el horario, no bloqueamos el día completo:
        // los slots vencidos se siguen filtrando con la hora actual.
        if (activo) setHorarios(null)
      })

    return () => { activo = false }
  }, [tenant?.id])

  useEffect(() => {
    if (!tenant?.id) return

    let activo = true
    setCargandoServicios(true)
    setServiciosError('')

    listarServicios(tenant.id)
      .then(data => {
        if (activo) setServicios(data)
      })
      .catch(err => {
        if (activo) {
          setServicios([])
          setServiciosError(getApiErrorMessage(err, 'No pudimos cargar los servicios del taller.'))
        }
      })
      .finally(() => {
        if (activo) setCargandoServicios(false)
      })

    return () => { activo = false }
  }, [tenant?.id, recargaServicios])

  useEffect(() => {
    if (preseleccionAplicada.current || servicioIdInicial == null || servicios.length === 0) return

    preseleccionAplicada.current = true
    const encontrado = servicios.find(servicio => servicio.id === Number(servicioIdInicial))
    if (encontrado) {
      setServicioSeleccionado(encontrado)
      setPaso(2)
    }
  }, [servicios, servicioIdInicial])

  useEffect(() => {
    if (!tenant?.id || !fechaSeleccionada || !servicioSeleccionado?.id) {
      setHorasDisponibles([])
      setCargandoHoras(false)
      return
    }

    let activo = true
    setCargandoHoras(true)
    setHorasError('')

    listarHorasDisponibles({
      tenantId: tenant.id,
      fecha: toDateKey(fechaSeleccionada),
      servicioId: servicioSeleccionado.id
    })
      .then(data => {
        if (activo) setHorasDisponibles(data?.horasDisponibles || [])
      })
      .catch(err => {
        if (activo) {
          setHorasDisponibles([])
          setHorasError(getApiErrorMessage(err, 'No pudimos consultar la disponibilidad del taller.'))
        }
      })
      .finally(() => {
        if (activo) setCargandoHoras(false)
      })

    return () => { activo = false }
  }, [tenant?.id, fechaSeleccionada, servicioSeleccionado?.id, recargaHoras])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [paso])


  const hoyKey = getDateKeyInTimeZone(ahora)
  const hoy = fromDateKey(hoyKey)
  const minutosAhora = getTimeInMinutesInTimeZone(ahora)
  const horarioHoy = (horarios || []).find(
    horario => horario.diaSemana === hoy.getDay() && horario.activo
  )
  const ultimoSlotHoy = ultimoSlotDeHorario(horarioHoy, servicioSeleccionado?.duracion)
  const hoySinDisponibilidad = horarios !== null && (
    !horarioHoy || ultimoSlotHoy === null || minutosAhora >= ultimoSlotHoy
  )
  const inicioMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const puedeRetroceder = mesActual > inicioMesActual

  const fechaSeleccionadaKey = fechaSeleccionada ? toDateKey(fechaSeleccionada) : ''
  const esHoySeleccionado = Boolean(fechaSeleccionadaKey) && fechaSeleccionadaKey === hoyKey
  const horasDelDia = filtrarHorasVigentes(horasDisponibles, fechaSeleccionadaKey, ahora)

  const diasDelMes = () => {
    const año = mesActual.getFullYear()
    const mes = mesActual.getMonth()
    const primerDia = new Date(año, mes, 1).getDay()
    const totalDias = new Date(año, mes + 1, 0).getDate()

    const dias = []
    for (let i = 0; i < primerDia; i++) dias.push(null)

    for (let dia = 1; dia <= totalDias; dia++) {
      const fecha = new Date(año, mes, dia)
      const esHoy = fecha.getTime() === hoy.getTime()
      dias.push({
        fecha,
        pasado: fecha < hoy,
        esDomingo: fecha.getDay() === 0,
        esHoy,
        sinCuposHoy: esHoy && hoySinDisponibilidad
      })
    }

    return dias
  }

  const cambiarMes = direccion => {
    setMesActual(prev => new Date(prev.getFullYear(), prev.getMonth() + direccion, 1))
  }

  const seleccionarServicio = servicio => {
    if (servicioSeleccionado?.id !== servicio.id) {
      setHoraSeleccionada(null)
      setHorasDisponibles([])
      setHorasError('')
    }
    setServicioSeleccionado(servicio)
    setPaso(2)
  }

  const seleccionarFecha = fecha => {
    if (!fechaSeleccionada || toDateKey(fecha) !== toDateKey(fechaSeleccionada)) {
      setHoraSeleccionada(null)
      setHorasDisponibles([])
      setHorasError('')
    }
    setFechaSeleccionada(fecha)
    setErrorEnvio('')
  }

  const seleccionarHora = hora => {
    setHoraSeleccionada(hora)
    setErrorEnvio('')
  }

  const actualizarCampo = (campo, valor) => {
    const normalizado = campo === 'patente' ? valor.toUpperCase() : valor
    setForm(prev => ({
      ...prev,
      [campo]: normalizado,
      // Al cambiar la marca, limpiar el modelo ya que puede no existir en la nueva lista
      ...(campo === 'marca' ? { modelo: '' } : {})
    }))
    setErrores(prev => ({ ...prev, [campo]: '' }))
    setErrorEnvio('')
  }

  const validarAlSalir = campo => {
    setErrores(prev => ({ ...prev, [campo]: validarCampo(campo, form[campo]) }))
  }

  const volver = () => {
    if (enviando) return
    if (paso > 1) {
      setErrorEnvio('')
      setPaso(paso - 1)
    } else {
      navigate(rutaInicio)
    }
  }

  const continuarAConfirmar = () => {
    const nuevosErrores = validarFormulario(form)
    setErrores(nuevosErrores)

    const primerCampoConError = CAMPOS.find(campo => nuevosErrores[campo])
    if (primerCampoConError) {
      document.getElementById(primerCampoConError)?.focus()
      return
    }

    setErrorEnvio('')
    setPaso(4)
  }

  const confirmarReserva = async () => {
    if (enviando) return

    if (!servicioSeleccionado || !fechaSeleccionada || !horaSeleccionada) {
      setErrorEnvio('Faltan datos de la reserva. Revisa los pasos anteriores antes de confirmar.')
      return
    }

    setEnviando(true)
    setErrorEnvio('')

    try {
      // Verificación final: la hora debe seguir disponible justo antes de crear la reserva.
      const disponibilidad = await listarHorasDisponibles({
        tenantId: tenant.id,
        fecha: toDateKey(fechaSeleccionada),
        servicioId: servicioSeleccionado.id
      })
      const horas = disponibilidad?.horasDisponibles || []
      setHorasDisponibles(horas)

      const horasVigentes = filtrarHorasVigentes(horas, toDateKey(fechaSeleccionada), new Date())
      if (!horasVigentes.includes(horaSeleccionada)) {
        setHoraSeleccionada(null)
        setHorasError('La hora que elegiste ya pasó o acaba de dejar de estar disponible. Selecciona otro horario.')
        setPaso(2)
        return
      }

      const reserva = await crearReserva({
        tenantId: tenant.id,
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim(),
        patente: form.patente.toUpperCase().trim(),
        kilometraje: form.kilometraje === '' ? undefined : Number(form.kilometraje),
        marca: form.marca || undefined,
        modelo: form.modelo || undefined,
        anio: form.anio === '' ? undefined : Number(form.anio),
        notas: form.observaciones.trim() || undefined,
        fecha: toDateKey(fechaSeleccionada),
        hora: horaSeleccionada,
        servicioId: servicioSeleccionado.id
      })

      navigate('/confirmacion', { state: { reserva, tenant } })
    } catch (err) {
      setErrorEnvio(getApiErrorMessage(err, 'No pudimos confirmar la reserva. Intenta nuevamente.'))
    } finally {
      setEnviando(false)
    }
  }


  if (cargandoTenant) {
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
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="h-3 w-24 animate-pulse rounded bg-graphite-100" />
          <div className="mt-3 h-7 w-64 animate-pulse rounded bg-graphite-100" />
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {[0, 1, 2, 3].map(item => (
              <div key={item} className="h-24 animate-pulse rounded-xl bg-graphite-100" />
            ))}
          </div>
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
            description={tenantError || 'No pudimos cargar la información del taller para iniciar la reserva.'}
            action={
              <Button variant="secondary" leftIcon={RefreshCw} onClick={recargarTenant}>
                Reintentar
              </Button>
            }
          />
          <div className="mt-4 text-center">
            <Link to={rutaInicio} className="text-sm font-medium text-accent-600 hover:text-accent-700">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
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

      <StepIndicator paso={paso} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-8">
        <div className="mb-5 flex items-start gap-3">
          <button
            type="button"
            onClick={volver}
            disabled={enviando}
            aria-label="Volver al paso anterior"
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-ink-muted transition-colors hover:bg-graphite-50 hover:text-ink focus-ring disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <div>
            <p className="micro-label">Paso {paso} de {PASOS_RESERVA.length}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{TITULOS[paso]}</h1>
            <p className="mt-1 text-sm text-ink-muted">{SUBTITULOS[paso]}</p>
          </div>
        </div>

        {paso === 4 && errorEnvio && (
          <Alert variant="error" title="No pudimos confirmar la reserva" className="mb-4">
            {errorEnvio}
          </Alert>
        )}


        {paso === 1 && (
          <div>
            {cargandoServicios ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {[0, 1, 2, 3].map(item => (
                  <div key={item} className="h-24 animate-pulse rounded-xl bg-graphite-100" />
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
                    onClick={() => setRecargaServicios(value => value + 1)}
                  >
                    Reintentar
                  </Button>
                </div>
              </Alert>
            ) : servicios.length === 0 ? (
              <EmptyState
                icon={Wrench}
                title="Sin servicios disponibles"
                description="El taller todavía no tiene servicios publicados para reservar en línea."
                action={
                  <Button variant="secondary" onClick={() => navigate(rutaInicio)}>
                    Volver al inicio
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {servicios.map(servicio => {
                  const seleccionado = servicioSeleccionado?.id === servicio.id
                  return (
                    <button
                      key={servicio.id}
                      type="button"
                      onClick={() => seleccionarServicio(servicio)}
                      aria-pressed={seleccionado}
                      className={`flex w-full items-start justify-between gap-3 rounded-xl border p-4 text-left transition-colors focus-ring ${
                        seleccionado
                          ? 'border-accent-400 bg-accent-50/50'
                          : 'border-line bg-surface hover:border-graphite-300 hover:bg-graphite-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink">{servicio.nombre}</p>
                        <p className="mt-1 text-xs text-ink-muted">{servicio.duracion} minutos</p>
                        {seleccionado && (
                          <p className="mt-2 text-xs font-semibold text-accent-700">Servicio seleccionado</p>
                        )}
                      </div>
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-graphite-400" aria-hidden="true" />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}


        {paso === 2 && (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <button
                type="button"
                onClick={() => cambiarMes(-1)}
                disabled={!puedeRetroceder}
                aria-label="Mes anterior"
                className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-graphite-100 hover:text-ink focus-ring disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <p className="text-sm font-semibold text-ink">{formatMonthYear(mesActual)}</p>
              <button
                type="button"
                onClick={() => cambiarMes(1)}
                aria-label="Mes siguiente"
                className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-graphite-100 hover:text-ink focus-ring"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="p-4">
              <div className="mb-1 grid grid-cols-7 gap-1">
                {DIAS_CORTOS.map(dia => (
                  <div
                    key={dia}
                    className="py-1 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-soft"
                  >
                    {dia}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {diasDelMes().map((dia, index) => {
                  if (!dia) return <div key={`vacio-${index}`} aria-hidden="true" />

                  const seleccionado = fechaSeleccionada && toDateKey(fechaSeleccionada) === toDateKey(dia.fecha)
                  const deshabilitado = dia.pasado || dia.esDomingo || dia.sinCuposHoy
                  const motivo = dia.esDomingo
                    ? ' (cerrado)'
                    : dia.sinCuposHoy
                      ? ' (sin horarios disponibles)'
                      : ''

                  return (
                    <button
                      key={toDateKey(dia.fecha)}
                      type="button"
                      disabled={deshabilitado}
                      onClick={() => seleccionarFecha(dia.fecha)}
                      aria-label={`${formatLongDate(dia.fecha)}${motivo}`}
                      title={dia.sinCuposHoy ? 'Ya no quedan horarios disponibles para hoy' : undefined}
                      aria-pressed={Boolean(seleccionado)}
                      className={`flex h-10 items-center justify-center rounded-md text-sm font-medium transition-colors focus-ring ${
                        seleccionado
                          ? 'bg-accent-400 text-white'
                          : deshabilitado
                            ? 'cursor-not-allowed text-graphite-300'
                            : dia.esHoy
                              ? 'bg-graphite-100 text-ink ring-1 ring-inset ring-graphite-300 hover:bg-accent-50'
                              : 'text-ink hover:bg-accent-50'
                      }`}
                    >
                      <span className="font-tabular">{dia.fecha.getDate()}</span>
                    </button>
                  )
                })}
              </div>

              <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-muted">
                <Clock className="h-3.5 w-3.5 text-graphite-400" aria-hidden="true" />
                Los domingos el taller permanece cerrado.
              </p>
            </div>
          </div>

        {fechaSeleccionada && (
          <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-ink">{formatLongDate(fechaSeleccionada)}</p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {servicioSeleccionado?.nombre} · {servicioSeleccionado?.duracion} minutos
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-graphite-50 px-2.5 py-1 text-xs font-medium text-ink-muted">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                {horaSeleccionada ? `Hora elegida: ${horaSeleccionada}` : 'Elige una hora'}
              </span>
            </div>

            <div className="p-4">
              {cargandoHoras ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map(item => (
                    <div key={item} className="h-11 animate-pulse rounded-md bg-graphite-100" />
                  ))}
                </div>
              ) : horasError ? (
                <Alert variant="warning" title="Disponibilidad no confirmada">
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <span>{horasError}</span>
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={RefreshCw}
                      onClick={() => setRecargaHoras(value => value + 1)}
                    >
                      Reintentar
                    </Button>
                  </div>
                </Alert>
              ) : horasDelDia.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="Sin horas disponibles"
                  description={
                    esHoySeleccionado
                      ? 'Ya pasó el último horario disponible para hoy. Elige otra fecha en el calendario.'
                      : 'No quedan cupos para este día. Elige otra fecha en el calendario.'
                  }
                />
              ) : (
                <>
                  <p className="mb-3 text-xs text-ink-muted">
                    Horarios generados según la duración del servicio.
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {horasDelDia.map(hora => {
                      const seleccionada = horaSeleccionada === hora
                      return (
                        <button
                          key={hora}
                          type="button"
                          onClick={() => seleccionarHora(hora)}
                          aria-pressed={seleccionada}
                          className={`h-11 rounded-md border text-sm font-semibold font-tabular transition-colors focus-ring ${
                            seleccionada
                              ? 'border-accent-400 bg-accent-400 text-white'
                              : 'border-line bg-surface text-ink hover:border-accent-300 hover:bg-accent-50'
                          }`}
                        >
                          {hora}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}

              {!cargandoHoras && !horasError && horaSeleccionada && horasDelDia.includes(horaSeleccionada) && (
                <div className="mt-4 flex justify-end border-t border-line pt-4">
                  <Button rightIcon={ArrowRight} onClick={() => setPaso(3)}>
                    Continuar con las {horaSeleccionada}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

          </div>
        )}


        {paso === 3 && (
          <div className="rounded-xl border border-line bg-surface shadow-card">
            <div className="grid gap-3 border-b border-line bg-graphite-50 px-4 py-3 sm:grid-cols-3">
              <div>
                <p className="micro-label">Servicio</p>
                <p className="mt-0.5 text-sm font-medium text-ink">{servicioSeleccionado?.nombre}</p>
              </div>
              <div>
                <p className="micro-label">Fecha</p>
                <p className="mt-0.5 text-sm font-medium text-ink">{formatLongDate(fechaSeleccionada)}</p>
              </div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="micro-label">Hora</p>
                  <p className="mt-0.5 text-sm font-medium text-ink">{horaSeleccionada}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPaso(2)}
                  className="text-xs font-semibold text-accent-600 transition-colors hover:text-accent-700"
                >
                  Cambiar
                </button>
              </div>
            </div>

            <form
              onSubmit={event => {
                event.preventDefault()
                continuarAConfirmar()
              }}
              className="p-4 sm:p-5"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id="nombre" label="Nombre completo" required error={errores.nombre}>
                  <Input
                    id="nombre"
                    name="nombre"
                    autoComplete="name"
                    placeholder="Ej. Juan Pérez"
                    maxLength={80}
                    value={form.nombre}
                    onChange={event => actualizarCampo('nombre', event.target.value)}
                    onBlur={() => validarAlSalir('nombre')}
                    invalid={Boolean(errores.nombre)}
                    aria-invalid={Boolean(errores.nombre) || undefined}
                    aria-describedby={errores.nombre ? 'nombre-error' : undefined}
                  />
                </FormField>

                <FormField id="telefono" label="Teléfono" required error={errores.telefono}>
                  <Input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+56 9 1234 5678"
                    maxLength={25}
                    value={form.telefono}
                    onChange={event => actualizarCampo('telefono', event.target.value)}
                    onBlur={() => validarAlSalir('telefono')}
                    invalid={Boolean(errores.telefono)}
                    aria-invalid={Boolean(errores.telefono) || undefined}
                    aria-describedby={errores.telefono ? 'telefono-error' : undefined}
                  />
                </FormField>

                <FormField
                  id="email"
                  label="Email (opcional)"
                  hint="Lo usamos solo para el detalle de tu reserva."
                  error={errores.email}
                >
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="juan@correo.cl"
                    maxLength={120}
                    value={form.email}
                    onChange={event => actualizarCampo('email', event.target.value)}
                    onBlur={() => validarAlSalir('email')}
                    invalid={Boolean(errores.email)}
                    aria-invalid={Boolean(errores.email) || undefined}
                    aria-describedby={errores.email ? 'email-error' : 'email-hint'}
                  />
                </FormField>

                <FormField
                  id="patente"
                  label="Patente del vehículo"
                  required
                  hint="Sin puntos ni guiones."
                  error={errores.patente}
                >
                  <Input
                    id="patente"
                    name="patente"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    placeholder="ABCD12"
                    maxLength={8}
                    className="font-tabular uppercase tracking-wider"
                    value={form.patente}
                    onChange={event => actualizarCampo('patente', event.target.value)}
                    onBlur={() => validarAlSalir('patente')}
                    invalid={Boolean(errores.patente)}
                    aria-invalid={Boolean(errores.patente) || undefined}
                    aria-describedby={errores.patente ? 'patente-error' : 'patente-hint'}
                  />
                </FormField>

                <FormField
                  id="kilometraje"
                  label="Kilometraje (opcional)"
                  hint="Ayuda a mantener el historial de mantenciones."
                >
                  <Input
                    id="kilometraje"
                    name="kilometraje"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    placeholder="Ej: 85000"
                    value={form.kilometraje}
                    onChange={event => actualizarCampo('kilometraje', event.target.value)}
                  />
                </FormField>

                <FormField id="marca" label="Marca (opcional)">
                  <select
                    id="marca"
                    name="marca"
                    value={form.marca}
                    onChange={event => actualizarCampo('marca', event.target.value)}
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
                  >
                    <option value="">Selecciona una marca</option>
                    {MARCAS.map(marca => (
                      <option key={marca} value={marca}>{marca}</option>
                    ))}
                  </select>
                </FormField>

                <FormField id="modelo" label="Modelo (opcional)">
                  {form.marca && form.marca !== 'Otro' && MARCAS_MODELOS[form.marca]?.length > 0 ? (
                    <select
                      id="modelo"
                      name="modelo"
                      value={form.modelo}
                      onChange={event => actualizarCampo('modelo', event.target.value)}
                      className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
                    >
                      <option value="">Selecciona un modelo</option>
                      {MARCAS_MODELOS[form.marca].map(modelo => (
                        <option key={modelo} value={modelo}>{modelo}</option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id="modelo"
                      name="modelo"
                      autoComplete="off"
                      placeholder={form.marca ? 'Ingresa el modelo' : 'Primero selecciona una marca'}
                      maxLength={60}
                      value={form.modelo}
                      onChange={event => actualizarCampo('modelo', event.target.value)}
                    />
                  )}
                </FormField>

                <FormField id="anio" label="Año (opcional)">
                  <Input
                    id="anio"
                    name="anio"
                    type="number"
                    inputMode="numeric"
                    min="1900"
                    max="2100"
                    step="1"
                    placeholder="Ej: 2019"
                    value={form.anio}
                    onChange={event => actualizarCampo('anio', event.target.value)}
                  />
                </FormField>
              </div>

              <div className="mt-4">
                <FormField
                  id="observaciones"
                  label="Observaciones (opcional)"
                  hint="Cuéntale al taller detalles adicionales sobre tu vehículo o el servicio que necesitas."
                >
                  <textarea
                    id="observaciones"
                    name="observaciones"
                    rows={3}
                    maxLength={500}
                    placeholder="Ej: El auto hace un ruido al frenar, revísalo también por favor."
                    value={form.observaciones}
                    onChange={event => actualizarCampo('observaciones', event.target.value)}
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent resize-none"
                  />
                  {form.observaciones.length > 400 && (
                    <p className="mt-1 text-xs text-ink-soft text-right">
                      {form.observaciones.length}/500
                    </p>
                  )}
                </FormField>
              </div>

              <div className="mt-5 flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="secondary" onClick={() => setPaso(2)}>
                  Cambiar fecha u hora
                </Button>
                <Button type="submit" rightIcon={ArrowRight}>
                  Revisar reserva
                </Button>
              </div>
            </form>
          </div>
        )}


        {paso === 4 && (
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
              <div className="border-b border-line px-4 py-3">
                <h2 className="text-sm font-semibold text-ink">Detalle de la cita</h2>
                <p className="mt-0.5 text-xs text-ink-muted">Estos son los datos que se enviarán al taller.</p>
              </div>

              <dl className="divide-y divide-line px-4">
                <Fila
                  etiqueta="Servicio"
                  valor={servicioSeleccionado?.nombre}
                  detalle={`${servicioSeleccionado?.duracion} minutos`}
                />
                <Fila etiqueta="Fecha" valor={formatLongDate(fechaSeleccionada)} />
                <Fila etiqueta="Hora" valor={horaSeleccionada} />
                <Fila etiqueta="Cliente" valor={form.nombre} />
                <Fila etiqueta="Teléfono" valor={form.telefono} />
                <Fila etiqueta="Email" valor={form.email || 'No informado'} />
                <Fila etiqueta="Patente" valor={form.patente} />
                {form.marca.trim() && <Fila etiqueta="Marca" valor={form.marca.trim()} />}
                {form.modelo.trim() && <Fila etiqueta="Modelo" valor={form.modelo.trim()} />}
                {form.anio !== '' && <Fila etiqueta="Año" valor={form.anio} />}
                {form.kilometraje !== '' && (
                  <Fila
                    etiqueta="Kilometraje"
                    valor={`${Number(form.kilometraje).toLocaleString('es-CL')} km`}
                  />
                )}
                {form.observaciones.trim() && (
                  <Fila etiqueta="Observaciones" valor={form.observaciones.trim()} />
                )}
              </dl>

              <div className="border-t border-line p-4">
                <Button
                  variant="secondary"
                  leftIcon={ArrowLeft}
                  onClick={() => setPaso(3)}
                  disabled={enviando}
                >
                  Editar datos
                </Button>
              </div>
            </div>

            <aside className="self-start rounded-xl border border-line bg-surface p-4 shadow-card">
              <p className="micro-label">Antes de confirmar</p>

              <ul className="mt-3 space-y-2.5">
                {[
                  'Revisa que el servicio, la fecha y la hora sean correctos.',
                  'La reserva quedará confirmada al enviarla.',
                  'Si necesitas cambiarla, contacta directamente al taller.'
                ].map(texto => (
                  <li key={texto} className="flex items-start gap-2 text-sm text-ink-muted">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-400" aria-hidden="true" />
                    {texto}
                  </li>
                ))}
              </ul>

              <div className="mt-4 rounded-lg border border-line bg-graphite-50 px-3 py-2.5">
                <p className="text-xs leading-relaxed text-ink-muted">
                  La reserva se registra a nombre de <span className="font-medium text-ink">{form.nombre}</span> para{' '}
                  <span className="font-medium text-ink">{tenant.nombre}</span>.
                </p>
              </div>

              <Button
                size="lg"
                className="mt-4 w-full"
                loading={enviando}
                disabled={enviando}
                onClick={confirmarReserva}
              >
                {enviando ? 'Confirmando reserva…' : 'Confirmar reserva'}
              </Button>
              <p className="mt-2 text-center text-xs text-ink-soft">
                No cierres esta página mientras enviamos tu reserva.
              </p>
            </aside>
          </div>
        )}
      </main>

      <PublicFooter tenant={tenant} />
    </div>
  )
}

function Fila({ etiqueta, valor, detalle }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[120px_1fr] sm:gap-4">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
        {etiqueta}
      </dt>
      <dd className="text-sm font-medium text-ink">
        {valor}
        {detalle && <span className="mt-0.5 block text-xs font-normal text-ink-muted">{detalle}</span>}
      </dd>
    </div>
  )
}

