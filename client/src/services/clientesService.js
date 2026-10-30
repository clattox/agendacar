import api from '../lib/api'

export async function listarClientes(q = '') {
  const { data } = await api.get('/clientes', { params: q ? { q } : {} })
  return data
}

export async function actualizarCliente(telefono, datos) {
  const { data } = await api.patch(`/clientes/${encodeURIComponent(telefono)}`, datos)
  return data
}
