const variants = {
  neutral: 'bg-graphite-100 text-graphite-700 ring-graphite-200',
  accent: 'bg-accent-50 text-accent-700 ring-accent-200',
  success: 'bg-success-50 text-success-700 ring-success-200',
  warning: 'bg-warning-50 text-warning-700 ring-warning-200',
  danger: 'bg-danger-50 text-danger-700 ring-danger-200',
  outline: 'bg-transparent text-ink-muted ring-line'
}

const dots = {
  neutral: 'bg-graphite-500',
  accent: 'bg-accent-400',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  outline: 'bg-ink-soft'
}

const sizes = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs'
}

export default function Badge({
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  children
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ring-1 ring-inset ${variants[variant] || variants.neutral} ${sizes[size] || sizes.md} ${className}`}
    >
      {dot && (
        <span className={`h-1.5 w-1.5 rounded-full ${dots[variant] || dots.neutral}`} aria-hidden="true" />
      )}
      {children}
    </span>
  )
}
