import api from '../lib/api'

// ── Catálogo de marcas/modelos ────────────────────────────────────────────────

export async function listarCatalogo(tenantId) {
  const { data } = await api.get(`/vehiculos/catalogo?tenantId=${tenantId}`)
  return data
}

export async function agregarCatalogo(datos) {
  const { data } = await api.post('/vehiculos/catalogo', datos)
  return data
}

export async function eliminarCatalogo(id) {
  const { data } = await api.delete(`/vehiculos/catalogo/${id}`)
  return data
}

// ── Vehículos ─────────────────────────────────────────────────────────────────

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
