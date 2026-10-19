import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

const Select = forwardRef(function Select(
  { className = '', invalid = false, children, ...props },
  ref
) {
  const border = invalid
    ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20'
    : 'border-line hover:border-graphite-300 focus:border-accent-400 focus:ring-accent-400/25'

  return (
    <div className="relative">
      <select
        ref={ref}
        className={`h-11 w-full appearance-none rounded-md border bg-surface pl-3.5 pr-10 text-sm text-ink transition-colors focus:outline-none focus:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-graphite-50 disabled:text-ink-muted ${border} ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
        aria-hidden="true"
      />
    </div>
  )
})

export default Select
