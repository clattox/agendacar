import { Loader2 } from 'lucide-react'

const base =
  'inline-flex select-none items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-150 focus-ring disabled:pointer-events-none disabled:opacity-50'

const variants = {
  primary: 'bg-accent-400 text-white shadow-sm hover:bg-accent-500 active:bg-accent-600',
  secondary: 'border border-line bg-surface text-ink hover:bg-graphite-50 active:bg-graphite-100',
  dark: 'bg-graphite-900 text-white hover:bg-graphite-800 active:bg-graphite-950',
  ghost: 'text-ink-muted hover:bg-graphite-100 hover:text-ink',
  danger: 'bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700',
  'danger-ghost': 'border border-line bg-surface text-danger-600 hover:bg-danger-50 hover:border-danger-200',
  success: 'bg-success-500 text-white hover:bg-success-600 active:bg-success-700'
}

const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base'
}

export function buttonClasses({ variant = 'primary', size = 'md', className = '' } = {}) {
  return `${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  children,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, className })}
      {...props}
    >
      {loading
        ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
        : LeftIcon
          ? <LeftIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
          : null}
      {children}
      {!loading && RightIcon && <RightIcon className="h-4 w-4 shrink-0" aria-hidden="true" />}
    </button>
  )
}
