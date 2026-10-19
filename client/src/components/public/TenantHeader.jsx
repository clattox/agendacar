import { Phone } from 'lucide-react'
import TenantAvatar from './TenantAvatar'

export default function TenantHeader({ tenant, actions }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
        <TenantAvatar tenant={tenant} size="md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight text-ink">
            {tenant.nombre}
          </p>
          {tenant.telefono ? (
            <a
              href={`tel:${tenant.telefono.replace(/\s+/g, '')}`}
              className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink-muted transition-colors hover:text-ink"
            >
              <Phone className="h-3 w-3" aria-hidden="true" />
              {tenant.telefono}
            </a>
          ) : (
            <p className="mt-0.5 text-xs text-ink-muted">Reservas online</p>
          )}
        </div>
        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
