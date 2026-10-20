import api from '../lib/api'

export async function iniciarSesion({ email, password }) {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

export async function cambiarPassword({ passwordActual, passwordNueva }) {
  const { data } = await api.patch('/auth/cambiar-password', { passwordActual, passwordNueva })
  return data
}
