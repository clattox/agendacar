import api from '../lib/api'

export async function obtenerTenant(subdominio) {
  const { data } = await api.get('/tenant', { params: { subdominio } })
  return data
}
