import api from '../lib/api'

export async function iniciarSesion({ email, password }) {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}
