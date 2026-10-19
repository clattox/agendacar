const sizes = {
  sm: 'h-9 w-9 rounded-md text-sm',
  md: 'h-11 w-11 rounded-lg text-base',
  lg: 'h-14 w-14 rounded-xl text-xl'
}

export default function TenantAvatar({ tenant, size = 'md', className = '' }) {
  const nombre = tenant?.nombre || 'Taller'
  return tenant?.logoUrl ? (
    <img
      src={tenant.logoUrl}
      alt={`Logo de ${nombre}`}
      className={`${sizes[size] || sizes.md} shrink-0 border border-line object-cover ${className}`}
    />
  ) : (
    <div
      className={`${sizes[size] || sizes.md} flex shrink-0 items-center justify-center bg-graphite-900 font-bold text-white ${className}`}
      aria-hidden="true"
    >
      {nombre.charAt(0).toUpperCase()}
    </div>
  )
}
