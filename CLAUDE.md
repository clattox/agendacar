# AgendaCar — Contexto para Claude

## Stack
- **Frontend**: React 18 + Vite + Tailwind CSS — deploy en Hostinger vía GitHub Actions
- **Backend**: Node.js + Express + Prisma 5.22.0 + PostgreSQL (Neon) — deploy en Render
- **Repo**: `clattox/agendacar` (rama `main`)

## Estructura relevante
```
client/src/
  pages/
    public/        → Inicio.jsx, Reservar.jsx (portal de reservas público)
    admin/         → Panel de administración (Login.jsx, etc.)
    flota/         → Módulo de flota: Dashboard, Vehiculos, Conductores, Documentos
  components/
    flota/         → FlotaLayout.jsx (sidebar desktop + drawer móvil)
    admin/         → ProtectedRoute.jsx
  hooks/           → useFlota.js, etc.
  lib/             → auth.js

server/
  controllers/     → tenantController.js, etc.
  routes/
  prisma/          → schema.prisma
```

## Multi-tenant
- Cada tenant tiene `tenantId` — **todas las queries deben filtrarlo**
- `soloFlota: true` → solo usan módulo de flota, sin portal de reservas
- `flotaActiva: true` → tienen el módulo de flota habilitado
- `ProtectedRoute` y `Login` ya redirigen `soloFlota` a `/flota`
- `Inicio.jsx` y `Reservar.jsx` muestran pantalla "Portal no disponible" si `soloFlota`

## Patrones de código establecidos

### Mobile responsive
- Padding: `p-4 md:p-7` (nunca solo `p-7`)
- Headers con botones: `flex flex-wrap gap-3 items-center justify-between`
- Botones: siempre `whitespace-nowrap`
- Tablas: wrapper con `overflow-x-auto`, tabla con `min-w-[Npx]`
- Celdas que no deben romper (patentes, RUT): `whitespace-nowrap`

### FlotaLayout (móvil)
- Desktop: sidebar fija `hidden md:flex w-56`
- Móvil: topbar + drawer con overlay, animado con `transform transition-transform`
- `useEffect` cierra drawer al cambiar ruta y bloquea scroll del body

## Restricciones absolutas
- ❌ No cambiar autenticación, API ni reglas de negocio
- ❌ No modificar el calendario, horarios, disponibilidad ni duración de servicios
- ❌ No instalar dependencias nuevas
- ❌ No modificar ningún SVG — solo leerlos y convertirlos a JSX si es necesario
- ❌ Los `viewBox` no cambian — los marcadores de daño usan posicionamiento porcentual
- ❌ SVG en JSX: atributos camelCase, estilos inline, sin clases CSS
- ❌ No usar `fill-rule: evenodd` en ningún path (causa agujeros negros en fondo oscuro)
- ✅ Siempre respetar aislamiento multitenant (`tenantId` en todas las queries)

## Colores del módulo de flota
- Fondo sidebar: `#30343B`
- Bordes sidebar: `#272B31`
- Texto secundario sidebar: `#8B9299`, `#D1D5DB`
- Acento activo: `amber-400` / `amber-500`
- Fondo app: `#EDEEF0`
