import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { estaAutenticado, getUsuario } from '../../lib/auth'

export default function ProtectedRoute() {
  const location = useLocation()

  if (!estaAutenticado()) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  // soloFlota: si el tenant solo tiene acceso a flota, redirigir desde /admin/* a /flota
  const usuario = getUsuario()
  if (usuario?.tenant?.soloFlota && location.pathname.startsWith('/admin')) {
    return <Navigate to="/flota" replace />
  }

  return <Outlet />
}
