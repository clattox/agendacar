// Resolución de tenant en cliente, a partir del hostname.
// Se conserva la regla existente: subdominio propio, o "demo" en local/hosting compartido.
export function getSubdominio(hostname = window.location.hostname) {
  const parts = hostname.split('.')
  const esSubdominio =
    parts.length > 2 &&
    parts[0] !== 'www' &&
    !hostname.includes('hostingersite.com') &&
    !hostname.includes('localhost')

  return esSubdominio ? parts[0] : 'demo'
}
