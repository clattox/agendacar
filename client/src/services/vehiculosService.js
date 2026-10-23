import api from '../lib/api'

export async function crearVehiculo(datos) {
  const { data } = await api.post('/vehiculos', datos)
  return data
}

export async function listarVehiculos() {
  const { data } = await api.get('/vehiculos')
  return data
}

export async function obtenerHistorialVehiculo(patente) {
  const { data } = await api.get(`/vehiculos/${encodeURIComponent(patente)}`)
  return data
}

export async function actualizarVehiculo(patente, datos) {
  const { data } = await api.patch(`/vehiculos/${encodeURIComponent(patente)}`, datos)
  return data
}
