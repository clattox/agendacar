import { lazy, Suspense } from 'react'
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
import Clientes from './pages/admin/Clientes'

// Páginas superadmin
import SuperadminLogin from './pages/superadmin/Login'
import SuperadminDashboard from './pages/superadmin/Dashboard'

// Control de Flota — carga diferida
const FlotaLayout       = lazy(() => import('./components/flota/FlotaLayout'))
const FlotaDashboard    = lazy(() => import('./pages/flota/Dashboard'))
const FlotaVehiculos    = lazy(() => import('./pages/flota/Vehiculos'))
const FlotaConductores  = lazy(() => import('./pages/flota/Conductores'))
const FlotaDocumentos   = lazy(() => import('./pages/flota/Documentos'))
const PortalConductor      = lazy(() => import('./pages/flota/PortalConductor'))
const FlotaVehiculoDetalle = lazy(() => import('./pages/flota/VehiculoDetalle'))

// Componentes
import ProtectedRoute from './components/admin/ProtectedRoute'
import SuperadminRoute from './components/superadmin/SuperadminRoute'

function FlotaSpinner() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#1C1F26]">
      <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

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
          <Route path="clientes" element={<Clientes />} />
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

        {/* ——— Portal Conductor (layout propio, sin sidebar admin) ———— */}
        <Route
          path="/flota/conductor"
          element={
            <Suspense fallback={<FlotaSpinner />}>
              <PortalConductor />
            </Suspense>
          }
        />

        {/* ——— Control de Flota ————————————————————————————
            Montado en /flota — mismo JWT, mismo tenant.
            En producción: flota.agendacar.cl sirve este mismo
            build, y el usuario entra directamente a /flota.
        ————————————————————————————————————————————————————— */}
        <Route
          path="/flota/*"
          element={
            <Suspense fallback={<FlotaSpinner />}>
              <FlotaLayout>
                <Routes>
                  <Route index element={<FlotaDashboard />} />
                  <Route path="vehiculos"      element={<FlotaVehiculos />} />
                  <Route path="vehiculos/:id" element={<FlotaVehiculoDetalle />} />
                  <Route path="conductores"   element={<FlotaConductores />} />
                  <Route path="documentos"    element={<FlotaDocumentos />} />
                </Routes>
              </FlotaLayout>
            </Suspense>
          }
        />

        {/* Ruta por slug: agendacar.cl/ewert */}
        <Route path="/:slug" element={<TenantPage />} />

        {/* Fallback */}
        <Route path="*" element={<Inicio />} />
      </Routes>
    </BrowserRouter>
  )
}
