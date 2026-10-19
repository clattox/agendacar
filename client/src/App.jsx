import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Páginas públicas
import Inicio from './pages/public/Inicio'
import Reservar from './pages/public/Reservar'
import Confirmacion from './pages/public/Confirmacion'

// Páginas admin
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import Agenda from './pages/admin/Agenda'
import Configuracion from './pages/admin/Configuracion'

// Componentes
import ProtectedRoute from './components/admin/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Inicio />} />
        <Route path="/reservar" element={<Reservar />} />
        <Route path="/confirmacion" element={<Confirmacion />} />

        {/* Rutas admin — el layout está dentro de cada página */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<ProtectedRoute />}>
          <Route index element={<Dashboard />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="configuracion" element={<Configuracion />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Inicio />} />
      </Routes>
    </BrowserRouter>
  )
}
