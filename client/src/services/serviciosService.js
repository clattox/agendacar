import api from '../lib/api'

export async function listarServicios(tenantId) {
  const { data } = await api.get('/servicios', { params: { tenantId } })
  return data
}

export async function crearServicio({ nombre, duracion }) {
  const { data } = await api.post('/servicios', { nombre, duracion })
  return data
}

export async function actualizarServicio(id, { nombre, duracion }) {
  const { data } = await api.put(`/servicios/${id}`, { nombre, duracion })
  return data
}

export async function eliminarServicio(id) {
  const { data } = await api.delete(`/servicios/${id}`)
  return data
}
