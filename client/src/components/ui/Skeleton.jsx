export default function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-graphite-100 ${className}`}
      aria-hidden="true"
    />
  )
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`h-3 animate-pulse rounded bg-graphite-100 ${index === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  )
}
