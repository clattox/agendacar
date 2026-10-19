import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'

const styles = {
  info: {
    box: 'border-graphite-200 bg-graphite-50',
    icon: 'text-graphite-500',
    Icon: Info
  },
  success: {
    box: 'border-success-200 bg-success-50',
    icon: 'text-success-600',
    Icon: CheckCircle2
  },
  warning: {
    box: 'border-warning-200 bg-warning-50',
    icon: 'text-warning-600',
    Icon: AlertTriangle
  },
  error: {
    box: 'border-danger-200 bg-danger-50',
    icon: 'text-danger-600',
    Icon: XCircle
  }
}

export default function Alert({
  variant = 'info',
  title,
  children,
  onDismiss,
  className = ''
}) {
  const style = styles[variant] || styles.info
  const Icon = style.Icon
  const urgente = variant === 'error'

  return (
    <div
      role={urgente ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${style.box} ${className}`}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.icon}`} aria-hidden="true" />
      <div className="min-w-0 flex-1 text-sm">
        {title && <p className="font-semibold text-ink">{title}</p>}
        {children && <div className={`text-ink-muted ${title ? 'mt-0.5' : ''}`}>{children}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-1 rounded p-1 text-ink-muted transition-colors hover:bg-graphite-100 hover:text-ink"
          aria-label="Cerrar mensaje"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
