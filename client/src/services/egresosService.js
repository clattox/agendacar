import api from '../lib/api'

export async function listarEgresos(desde, hasta) {
  const params = {}
  if (desde) params.desde = desde
  if (hasta) params.hasta = hasta
  const { data } = await api.get('/egresos', { params })
  return data
}

export async function crearEgreso(datos) {
  const { data } = await api.post('/egresos', datos)
  return data
}

export async function eliminarEgreso(id) {
  const { data } = await api.delete(`/egresos/${id}`)
  return data
}
