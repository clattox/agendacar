import { Loader2 } from 'lucide-react'

export default function Spinner({ className = 'h-5 w-5', label = 'Cargando' }) {
  return (
    <span role="status" aria-label={label} className="inline-flex">
      <Loader2 className={`${className} animate-spin text-graphite-400`} aria-hidden="true" />
    </span>
  )
}
