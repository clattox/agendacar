import api from '../lib/api'

export async function getCierre(reservaId) {
  const { data } = await api.get(`/cierres/${reservaId}`)
  return data
}

export async function guardarCierre(reservaId, datos) {
  const { data } = await api.post(`/cierres/${reservaId}`, datos)
  return data
}

export async function actualizarNotasCierre(reservaId, notas) {
  const { data } = await api.patch(`/cierres/${reservaId}/notas`, { notas })
  return data
}
