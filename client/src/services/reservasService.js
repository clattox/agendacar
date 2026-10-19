import api from '../lib/api'

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
