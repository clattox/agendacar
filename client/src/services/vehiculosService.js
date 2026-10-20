import api from '../lib/api'

export const obtenerHistorialVehiculo = async (patente) => {
  const { data } = await api.get(`/vehiculos/${encodeURIComponent(patente)}`)
  return data
}
