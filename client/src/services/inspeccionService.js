import { getAuthHeaders } from '../lib/auth'

const API = import.meta.env.VITE_API_URL

export const getInspeccion = async (reservaId) => {
  const res = await fetch(`${API}/api/inspecciones/${reservaId}`, {
    headers: getAuthHeaders()
  })
  if (!res.ok) throw new Error('Error al obtener inspección')
  return res.json()
}

export const guardarInspeccion = async (reservaId, data) => {
  const res = await fetch(`${API}/api/inspecciones/${reservaId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Error al guardar inspección')
  return res.json()
}

export const confirmarInspeccion = async (reservaId) => {
  const res = await fetch(`${API}/api/inspecciones/${reservaId}/confirmar`, {
    method: 'PATCH',
    headers: getAuthHeaders()
  })
  if (!res.ok) throw new Error('Error al confirmar inspección')
  return res.json()
}

export const getHistorialVehiculo = async (patente) => {
  const res = await fetch(`${API}/api/inspecciones/vehiculo/${encodeURIComponent(patente)}`, {
    headers: getAuthHeaders()
  })
  if (!res.ok) throw new Error('Error al obtener historial')
  return res.json()
}
