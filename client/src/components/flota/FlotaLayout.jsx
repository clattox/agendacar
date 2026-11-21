// components/flota/FlotaLayout.jsx
// Layout principal del módulo Control de Flota.
// Desktop: sidebar fija. Móvil: topbar + drawer con overlay.

import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { clearSession } from '../../lib/auth'
import { useTenantInfo } from '../../hooks/useFlota'

const NAV = [
  {
    to: '/flota',
    end: true,
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    to: '/flota/vehiculos',
    label: 'Vehículos',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path d="M5 17H3a1 1 0 0 1-1-1v-5l2.5-5H17l2.5 5H22v5a1 1 0 0 1-1 1h-2" />
        <circle cx="7.5" cy="17.5" r="2.5" />
        <circle cx="16.5" cy="17.5" r="2.5" />
      </svg>
    ),
  },
  {
    to: '/flota/conductores',
    label: 'Conductores',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    to: '/flota/documentos',
    label: 'Documentos',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="16" y2="17" />
      </svg>
    ),
  },
  {
    to: '/flota/reportes',
    label: 'Reportes',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
  {
    to: '/flota/configuracion',
    label: 'Configuración',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
]

function SidebarContent({ onNavigate, navigate, tenant }) {
  return (
    <div className="flex flex-col h-full">
      {/* Branding */}
      <div className="px-5 py-5 border-b border-[#272B31]">
        <button
          onClick={() => { clearSession(); navigate('/admin/login') }}
          className="flex items-center gap-2.5 text-[#8B9299] hover:text-[#D1D5DB] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          <span className="text-xs font-semibold">Salir</span>
        </button>
        <div className="mt-3 flex items-center gap-2.5">
          {/* Logo de empresa */}
          {tenant?.logoUrl ? (
            <img
              src={tenant.logoUrl}
              alt={tenant.nombre}
              className="w-8 h-8 rounded-lg object-contain bg-white/10 p-0.5 flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="M5 17H3a1 1 0 0 1-1-1v-5l2.5-5H17l2.5 5H22v5a1 1 0 0 1-1 1h-2" />
                <circle cx="7.5" cy="17.5" r="2.5" />
                <circle cx="16.5" cy="17.5" r="2.5" />
              </svg>
            </div>
          )}
          <div className="min-w-0">
            <div className="text-[11px] text-[#8B9299] leading-none mb-0.5">Control de Flota</div>
            <div className="text-sm font-bold text-white leading-tight truncate">
              {tenant?.nombre || '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-lg mb-0.5 text-sm font-medium transition-all relative
               ${isActive
                 ? 'bg-[#454A52] text-amber-400'
                 : 'text-[#D1D5DB] hover:bg-[#3B4048] hover:text-white'
               }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-400 rounded-r-full" />
                )}
                {item.icon}
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#272B31]">
        <span className="text-[11px] text-[#737B86]">Flota v1.0</span>
      </div>
    </div>
  )
}

export default function FlotaLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { data: tenant } = useTenantInfo()

  // Cierra el drawer al cambiar de ruta
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  // Bloquea scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  return (
    <div className="flex h-screen bg-[#EDEEF0] overflow-hidden">

      {/* ——— Sidebar desktop (md+) ——— */}
      <aside className="hidden md:flex w-56 flex-shrink-0 flex-col bg-[#30343B] border-r border-[#272B31]">
        <SidebarContent onNavigate={() => {}} navigate={navigate} tenant={tenant} />
      </aside>

      {/* ——— Drawer móvil ——— */}
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 md:hidden
          ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      {/* Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] flex flex-col bg-[#30343B]
          transform transition-transform duration-300 ease-in-out md:hidden
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Menú de navegación"
      >
        {/* Botón cerrar en la esquina */}
        <button
          onClick={() => setDrawerOpen(false)}
          className="absolute top-4 right-4 text-[#8B9299] hover:text-white transition-colors p-1"
          aria-label="Cerrar menú"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <SidebarContent onNavigate={() => setDrawerOpen(false)} navigate={navigate} tenant={tenant} />
      </aside>

      {/* ——— Área principal ——— */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Topbar móvil */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-[#30343B] border-b border-[#272B31] flex-shrink-0">
          <button
            onClick={() => setDrawerOpen(true)}
            className="text-[#D1D5DB] hover:text-white transition-colors p-1 -ml-1 flex-shrink-0"
            aria-label="Abrir menú"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2 min-w-0">
            {tenant?.logoUrl ? (
              <img
                src={tenant.logoUrl}
                alt={tenant.nombre}
                className="w-6 h-6 rounded object-contain bg-white/10 flex-shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded bg-amber-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M5 17H3a1 1 0 0 1-1-1v-5l2.5-5H17l2.5 5H22v5a1 1 0 0 1-1 1h-2" />
                  <circle cx="7.5" cy="17.5" r="2.5" />
                  <circle cx="16.5" cy="17.5" r="2.5" />
                </svg>
              </div>
            )}
            <span className="text-sm font-bold text-white truncate">
              {tenant?.nombre || 'Control de Flota'}
            </span>
          </div>
        </header>

        {/* Contenido */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
