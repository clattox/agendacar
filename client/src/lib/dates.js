export const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
export const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const pad = value => String(value).padStart(2, '0')

// Las reservas guardan la hora de taller (wall-clock) codificada en UTC.
// Se lee siempre en UTC para no desplazarla a la zona del navegador.
const RESERVATION_TIME_ZONE = 'UTC'

// Zona horaria de referencia para la atención del taller.
export const WORKSHOP_TIME_ZONE = 'America/Santiago'

const timeZoneFormatters = new Map()

function getTimeZoneFormatter(timeZone) {
  if (!timeZoneFormatters.has(timeZone)) {
    timeZoneFormatters.set(timeZone, new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }))
  }
  return timeZoneFormatters.get(timeZone)
}

export function getDateTimePartsInTimeZone(date = new Date(), timeZone = WORKSHOP_TIME_ZONE) {
  const parts = getTimeZoneFormatter(timeZone).formatToParts(date)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute)
  }
}

// Clave YYYY-MM-DD del calendario del taller (por defecto America/Santiago).
export function getDateKeyInTimeZone(date = new Date(), timeZone = WORKSHOP_TIME_ZONE) {
  const { year, month, day } = getDateTimePartsInTimeZone(date, timeZone)
  return `${year}-${pad(month)}-${pad(day)}`
}

// Minutos transcurridos del día en la zona horaria indicada.
export function getTimeInMinutesInTimeZone(date = new Date(), timeZone = WORKSHOP_TIME_ZONE) {
  const { hour, minute } = getDateTimePartsInTimeZone(date, timeZone)
  return hour * 60 + minute
}

// Clave local YYYY-MM-DD (evita el desfase UTC de toISOString).
export function toDateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function fromDateKey(key) {
  const [year, month, day] = String(key).split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function addDays(date, days) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  result.setDate(result.getDate() + days)
  return result
}

// Semana que comienza el lunes.
export function startOfWeek(date = new Date()) {
  const day = date.getDay()
  return addDays(startOfDay(date), day === 0 ? -6 : 1 - day)
}

export function isSameDay(a, b) {
  return Boolean(a && b) && toDateKey(a) === toDateKey(b)
}

export function isPastDay(date) {
  return startOfDay(date) < startOfDay(new Date())
}

export function capitalize(text = '') {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function formatLongDate(date) {
  return capitalize(date.toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }))
}

export function formatFullDate(date) {
  return capitalize(date.toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }))
}

export function formatShortDate(date) {
  return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}

export function formatWeekRange(startDate) {
  const endDate = addDays(startDate, 6)
  const sameMonth = startDate.getMonth() === endDate.getMonth()
  const start = startDate.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: sameMonth ? undefined : 'short'
  })
  const end = endDate.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
  return `${start} – ${end} de ${endDate.getFullYear()}`
}

// Clave YYYY-MM-DD de una reserva, leída en UTC (misma convención que el backend).
export function toReservationDateKey(iso) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

// Reloj local actual expresado en la misma convención de las reservas.
// Permite comparar "ahora" contra una hora de taller sin desfase UTC.
export function nowAsReservationDate(date = new Date()) {
  return new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds()
  ))
}

export function formatTimeFromISO(iso) {
  return new Date(iso).toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: RESERVATION_TIME_ZONE
  })
}

export function formatDateFromISO(iso) {
  return capitalize(new Date(iso).toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: RESERVATION_TIME_ZONE
  }))
}

export function formatDateTimeFromISO(iso) {
  return new Date(iso).toLocaleString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: RESERVATION_TIME_ZONE
  })
}

export function formatMonthYear(date) {
  return `${MESES[date.getMonth()]} ${date.getFullYear()}`
}
