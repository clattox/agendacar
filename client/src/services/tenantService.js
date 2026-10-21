import api from '../lib/api'

export async function obtenerTenant(subdominio) {
  const { data } = await api.get('/tenant', { params: { subdominio } })
  return data
}

export async function actualizarTenant({ nombre, telefono, email, logoUrl }) {
  const { data } = await api.put('/tenant', { nombre, telefono, email, logoUrl })
  return data
}
