import Badge from '../ui/Badge'

export const ESTADOS_RESERVA = {
  confirmada: { label: 'Confirmada', variant: 'accent' },
  atendida: { label: 'Atendida', variant: 'success' },
  cancelada: { label: 'Cancelada', variant: 'neutral' }
}

export default function EstadoBadge({ estado, size = 'md' }) {
  const config = ESTADOS_RESERVA[estado] || {
    label: estado || 'Sin estado',
    variant: 'outline'
  }

  return (
    <Badge variant={config.variant} size={size} dot>
      {config.label}
    </Badge>
  )
}
