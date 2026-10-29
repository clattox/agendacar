import api from '../lib/api'

export async function getCotizacion(reservaId) {
  const { data } = await api.get(`/cotizaciones/${reservaId}`)
  return data
}

export async function guardarCotizacion(reservaId, datos) {
  const { data } = await api.post(`/cotizaciones/${reservaId}`, datos)
  return data
}

export async function enviarEmailCotizacion(reservaId) {
  const { data } = await api.post(`/cotizaciones/${reservaId}/email`)
  return data
}
