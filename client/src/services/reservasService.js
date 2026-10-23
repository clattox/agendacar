import api from '../lib/api'
import { getToken } from '../lib/auth'

export async function listarReservasPorFecha(fecha) {
  const { data } = await api.get('/reservas', { params: { fecha } })
  return data
}

export async function listarHorasDisponibles({ tenantId, fecha, servicioId }) {
  const { data } = await api.get('/reservas/disponibles', {
    params: { tenantId, fecha, servicioId }
  })
  return data
}

export async function crearReserva(payload) {
  const { data } = await api.post('/reservas/nueva', payload)
  return data
}

export async function actualizarEstadoReserva(id, estado) {
  const { data } = await api.patch(`/reservas/${id}/estado`, { estado })
  return data
}

export async function reagendarReserva(id, { fecha, hora }) {
  const { data } = await api.patch(`/reservas/${id}`, { fecha, hora })
  return data
}

export async function eliminarReserva(id) {
  const { data } = await api.delete(`/reservas/${id}`)
  return data
}

export async function asignarTrabajadoresReserva(id, trabajadorIds) {
  const { data } = await api.put(`/reservas/${id}/trabajadores`, { trabajadorIds })
  return data
}

export async function exportarReservasCSV({ desde, hasta } = {}) {
  const params = new URLSearchParams()
  if (desde) params.set('desde', desde)
  if (hasta) params.set('hasta', hasta)

  const base = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
  const url = `${base}/reservas/exportar?${params.toString()}`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${getToken()}` }
  })

  if (!res.ok) throw new Error('Error al exportar')

  const blob = await res.blob()
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = `reservas_${desde ?? 'inicio'}_${hasta ?? 'hoy'}.csv`
  a.click()
  URL.revokeObjectURL(href)
}
