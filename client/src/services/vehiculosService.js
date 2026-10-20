import api from '../lib/api'

export async function obtenerHistorialVehiculo(patente) {
  const { data } = await api.get(`/vehiculos/${encodeURIComponent(patente)}`)
  return data
}
