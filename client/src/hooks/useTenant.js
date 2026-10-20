import { useEffect, useMemo, useState } from 'react'
import { getSubdominio } from '../lib/tenant'
import { obtenerTenant } from '../services/tenantService'
import { getApiErrorMessage } from '../lib/errors'

// Obtiene el tenant del subdominio actual o de ?tenant= (desarrollo). Si la
// navegación ya trae el tenant (por ejemplo, desde la portada), se reutiliza
// para evitar una llamada extra.
export default function useTenant(initialTenant = null, slugOverride = null) {
  const subdominio = useMemo(() => slugOverride || getSubdominio(), [slugOverride])
  const [tenant, setTenant] = useState(initialTenant)
  const [loading, setLoading] = useState(!initialTenant)
  const [error, setError] = useState('')
  const [recarga, setRecarga] = useState(0)

  useEffect(() => {
    if (initialTenant) {
      setTenant(initialTenant)
      setLoading(false)
      setError('')
      return
    }

    let activo = true
    setLoading(true)
    setError('')

    obtenerTenant(subdominio)
      .then(data => {
        if (activo) setTenant(data)
      })
      .catch(err => {
        if (activo) {
          setTenant(null)
          setError(getApiErrorMessage(err, 'No pudimos encontrar este taller.'))
        }
      })
      .finally(() => {
        if (activo) setLoading(false)
      })

    return () => { activo = false }
  }, [subdominio, initialTenant, recarga])

  return {
    tenant,
    subdominio,
    loading,
    error,
    recargar: () => setRecarga(value => value + 1)
  }
}
