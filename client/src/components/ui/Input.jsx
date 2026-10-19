import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  { className = '', invalid = false, ...props },
  ref
) {
  const border = invalid
    ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20'
    : 'border-line hover:border-graphite-300 focus:border-accent-400 focus:ring-accent-400/25'

  return (
    <input
      ref={ref}
      className={`h-11 w-full rounded-md border bg-surface px-3.5 text-sm text-ink placeholder:text-ink-soft transition-colors focus:outline-none focus:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-graphite-50 disabled:text-ink-muted ${border} ${className}`}
      {...props}
    />
  )
})

export default Input
