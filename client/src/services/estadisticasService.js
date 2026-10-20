import api from '../lib/api'

export async function obtenerResumenEstadisticas() {
  const { data } = await api.get('/estadisticas/resumen')
  return data
}

export async function obtenerServiciosEstadisticas() {
  const { data } = await api.get('/estadisticas/servicios')
  return data
}

export async function obtenerDiasEstadisticas() {
  const { data } = await api.get('/estadisticas/dias')
  return data
}
