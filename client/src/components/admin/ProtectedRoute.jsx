import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { estaAutenticado } from '../../lib/auth'

export default function ProtectedRoute() {
  const location = useLocation()

  if (!estaAutenticado()) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
