import api from '../lib/api'

export async function iniciarSesion({ email, password, turnstileToken }) {
  const { data } = await api.post('/auth/login', {
    email,
    password,
    'cf-turnstile-response': turnstileToken
  })
  return data
}

export async function cambiarPassword({ passwordActual, passwordNueva }) {
  const { data } = await api.patch('/auth/cambiar-password', { passwordActual, passwordNueva })
  return data
}
