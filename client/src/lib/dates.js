export const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
export const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const pad = value => String(value).padStart(2, '0')

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

// Se mantiene el formato de hora que ya usaba el proyecto (zona local del navegador).
export function formatTimeFromISO(iso) {
  return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

export function formatDateFromISO(iso) {
  return capitalize(new Date(iso).toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }))
}

export function formatDateTimeFromISO(iso) {
  return new Date(iso).toLocaleString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatMonthYear(date) {
  return `${MESES[date.getMonth()]} ${date.getFullYear()}`
}
