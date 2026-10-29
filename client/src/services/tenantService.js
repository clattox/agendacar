import api from '../lib/api'

export async function obtenerTenant(subdominio) {
  const { data } = await api.get('/tenant', { params: { subdominio } })
  return data
}

export async function actualizarTenant({ nombre, telefono, email, logoUrl, direccion, inspeccionActiva, recordatorioActivo, recordatorioHora, recordatorioDias, categoria, colorPrimario }) {
  const { data } = await api.put('/tenant', { nombre, telefono, email, logoUrl, direccion, inspeccionActiva, recordatorioActivo, recordatorioHora, recordatorioDias, categoria, colorPrimario })
  return data
}
