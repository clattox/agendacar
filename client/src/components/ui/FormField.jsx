export default function FormField({
  id,
  label,
  required = false,
  hint,
  error,
  className = '',
  children
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && (
          <span className="ml-1 text-danger-500" aria-hidden="true">*</span>
        )}
      </label>

      {children}

      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-danger-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
