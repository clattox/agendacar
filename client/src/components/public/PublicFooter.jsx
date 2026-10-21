import { Mail, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PublicFooter({ tenant }) {
  return (
    <footer className="mt-12 border-t border-line bg-surface">
      {/* Fila principal: datos taller + nav */}
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pt-5 pb-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Datos del taller */}
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

        {/* Nav links */}
        <nav className="flex items-center gap-4 text-xs text-ink-muted" aria-label="Footer">
          <Link to="/privacidad" className="transition-colors hover:text-ink">Privacidad</Link>
          <span aria-hidden="true" className="text-line">·</span>
          <Link to="/terminos" className="transition-colors hover:text-ink">Términos</Link>
          <span aria-hidden="true" className="text-line">·</span>
          <Link to="/admin/login" className="transition-colors hover:text-ink">Acceso taller</Link>
        </nav>
      </div>

      {/* Atribución */}
      <div className="mx-auto max-w-3xl border-t border-line px-4 py-3 text-center text-[11px] text-ink-soft">
        Reservas online con AgendaCar &middot;{' '}
        <a
          href="https://claunet.cl"
          target="_blank"
          rel="noreferrer"
          className="transition-colors hover:text-ink-muted"
        >
          Desarrollado por ClauNet
        </a>
      </div>
    </footer>
  )
}
