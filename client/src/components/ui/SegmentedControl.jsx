export default function SegmentedControl({ options, value, onChange, ariaLabel, className = '' }) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex rounded-md border border-line bg-graphite-50 p-1 ${className}`}
    >
      {options.map(option => {
        const Icon = option.icon
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors focus-ring ${
              active
                ? 'bg-surface text-ink shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
