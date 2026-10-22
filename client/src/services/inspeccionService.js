import { getToken } from '../lib/auth'

const API = import.meta.env.VITE_API_URL

const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` })

export const getInspeccion = async (reservaId) => {
  const res = await fetch(`${API}/api/inspecciones/${reservaId}`, {
    headers: authHeaders()
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Error ${res.status} al obtener inspección`)
  }
  return res.json()
}

export const guardarInspeccion = async (reservaId, data) => {
  const res = await fetch(`${API}/api/inspecciones/${reservaId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Error al guardar inspección')
  return res.json()
}

export const confirmarInspeccion = async (reservaId) => {
  const res = await fetch(`${API}/api/inspecciones/${reservaId}/confirmar`, {
    method: 'PATCH',
    headers: authHeaders()
  })
  if (!res.ok) throw new Error('Error al confirmar inspección')
  return res.json()
}

export const getHistorialVehiculo = async (patente) => {
  const res = await fetch(`${API}/api/inspecciones/vehiculo/${encodeURIComponent(patente)}`, {
    headers: authHeaders()
  })
  if (!res.ok) throw new Error('Error al obtener historial')
  return res.json()
}
