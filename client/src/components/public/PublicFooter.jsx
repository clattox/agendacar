import { Mail, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PublicFooter({ tenant }) {
  return (
    <footer className="mt-12 border-t border-line bg-surface">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-ink">{tenant?.nombre}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
            {tenant?.telefono && (
              <a
                href={`tel:${tenant.telefono.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-1 transition-colors hover:text-ink"
              >
                <Phone className="h-3 w-3" aria-hidden="true" />
                {tenant.telefono}
              </a>
            )}
            {tenant?.email && (
              <a
                href={`mailto:${tenant.email}`}
                className="inline-flex items-center gap-1 transition-colors hover:text-ink"
              >
                <Mail className="h-3 w-3" aria-hidden="true" />
                {tenant.email}
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-ink-soft">
          <span>Reservas online con AgendaCar</span>
          <span aria-hidden="true">·</span>
          <Link to="/privacidad" className="transition-colors hover:text-ink">
            Privacidad
          </Link>
          <span aria-hidden="true">·</span>
          <Link to="/terminos" className="transition-colors hover:text-ink">
            Términos
          </Link>
          <span aria-hidden="true">·</span>
          <Link to="/admin/login" className="transition-colors hover:text-ink">
            Acceso taller
          </Link>
        </div>
      </div>
    </footer>
  )
}
