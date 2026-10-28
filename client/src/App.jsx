import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Páginas públicas
import Landing from './pages/public/Landing'
import Inicio from './pages/public/Inicio'
import TenantPage from './pages/public/TenantPage'
import Reservar from './pages/public/Reservar'
import Confirmacion from './pages/public/Confirmacion'
import Privacidad from './pages/public/Privacidad'
import Terminos from './pages/public/Terminos'

// Páginas admin
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import Agenda from './pages/admin/Agenda'
import Configuracion from './pages/admin/Configuracion'
import Trabajadores from './pages/admin/Trabajadores'
import Vehiculos from './pages/admin/Vehiculos'
import Inspeccion from './pages/admin/Inspeccion'
import Caja from './pages/admin/Caja'

// Páginas superadmin
import SuperadminLogin from './pages/superadmin/Login'
import SuperadminDashboard from './pages/superadmin/Dashboard'

// Componentes
import ProtectedRoute from './components/admin/ProtectedRoute'
import SuperadminRoute from './components/superadmin/SuperadminRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Landing />} />
        <Route path="/reservar" element={<Reservar />} />
        <Route path="/confirmacion" element={<Confirmacion />} />
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/terminos" element={<Terminos />} />

        {/* Rutas admin — el layout está dentro de cada página */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<ProtectedRoute />}>
          <Route index element={<Dashboard />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="trabajadores" element={<Trabajadores />} />
          <Route path="vehiculos" element={<Vehiculos />} />
          <Route path="configuracion" element={<Configuracion />} />
          <Route path="inspeccion/:reservaId" element={<Inspeccion />} />
          <Route path="caja" element={<Caja />} />
        </Route>

        {/* Rutas superadmin */}
        <Route path="/superadmin/login" element={<SuperadminLogin />} />
        <Route path="/superadmin" element={<SuperadminRoute />}>
          <Route index element={<SuperadminDashboard />} />
        </Route>

        {/* Ruta por slug: agendacar.cl/ewert */}
        <Route path="/:slug" element={<TenantPage />} />

        {/* Fallback */}
        <Route path="*" element={<Inicio />} />
      </Routes>
    </BrowserRouter>
  )
}
