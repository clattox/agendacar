import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getToken, getUsuario } from '../../lib/auth'

export default function SuperadminRoute() {
  const location = useLocation()
  const token = getToken()
  const usuario = getUsuario()

  if (!token || usuario?.rol !== 'superadmin') {
    return <Navigate to="/superadmin/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
