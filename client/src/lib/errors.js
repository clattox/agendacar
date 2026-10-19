export function getApiErrorMessage(error, fallback = 'Ocurrió un error inesperado. Intenta nuevamente.') {
  if (error?.code === 'ERR_CANCELED') return ''
  if (error?.code === 'ERR_NETWORK') {
    return 'No pudimos conectar con el servidor. Revisa tu conexión e intenta nuevamente.'
  }
  return error?.response?.data?.error || fallback
}
