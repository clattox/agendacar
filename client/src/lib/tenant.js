// Tenant explícito por query string (?tenant=ewert), útil sin dominio propio.
export function getTenantFromQuery(
  search = typeof window !== 'undefined' ? window.location.search : ''
) {
  return new URLSearchParams(search).get('tenant')?.trim() || ''
}

// Resolución de tenant en cliente.
// Prioridad: subdominio real > ?tenant= (útil en desarrollo) > "demo".
export function getSubdominio(
  hostname = window.location.hostname,
  search = typeof window !== 'undefined' ? window.location.search : ''
) {
  const parts = hostname.split('.')
  const esIP = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)
  const esSubdominio =
    !esIP &&
    parts.length > 2 &&
    parts[0] !== 'www' &&
    !hostname.includes('hostingersite.com') &&
    !hostname.includes('localhost')

  if (esSubdominio) return parts[0]

  return getTenantFromQuery(search) || 'demo'
}
