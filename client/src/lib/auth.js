const TOKEN_KEY = 'token'
const USUARIO_KEY = 'usuario'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUsuario() {
  try {
    return JSON.parse(localStorage.getItem(USUARIO_KEY) || 'null')
  } catch {
    return null
  }
}

export function saveSession({ token, usuario }) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USUARIO_KEY)
}

export function estaAutenticado() {
  return Boolean(getToken())
}
