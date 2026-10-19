import axios from 'axios'
import { clearSession, getToken } from './auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
})

// Agregar token automáticamente
api.interceptors.request.use(config => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirigir a login si el token expiró.
// No se fuerza recarga en el propio login para no perder el mensaje de error.
api.interceptors.response.use(
  res => res,
  err => {
    const esLogin = err.config?.url?.includes('/auth/login')
    if (err.response?.status === 401 && !esLogin) {
      clearSession()
      if (!window.location.pathname.startsWith('/admin/login')) {
        window.location.assign('/admin/login')
      }
    }
    return Promise.reject(err)
  }
)

export default api
