import { getToken } from '../lib/auth'

const API = import.meta.env.VITE_API_URL

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`
})

export const listarTrabajadores = async () => {
  const res = await fetch(`${API}/trabajadores`, { headers: headers() })
  if (!res.ok) throw new Error('Error al cargar trabajadores')
  return res.json()
}

export const crearTrabajador = async (datos) => {
  const res = await fetch(`${API}/trabajadores`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(datos)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Error al crear trabajador')
  }
  return res.json()
}

export const actualizarTrabajador = async (id, datos) => {
  const res = await fetch(`${API}/trabajadores/${id}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(datos)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Error al actualizar trabajador')
  }
  return res.json()
}

export const eliminarTrabajador = async (id) => {
  const res = await fetch(`${API}/trabajadores/${id}`, {
    method: 'DELETE',
    headers: headers()
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Error al eliminar trabajador')
  }
  return res.json()
}
