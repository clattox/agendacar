import { Check } from 'lucide-react'

export const PASOS_RESERVA = [
  { numero: 1, label: 'Servicio' },
  { numero: 2, label: 'Fecha' },
  { numero: 3, label: 'Hora' },
  { numero: 4, label: 'Datos' },
  { numero: 5, label: 'Confirmar' }
]

export default function StepIndicator({ paso }) {
  const actual = PASOS_RESERVA.find(item => item.numero === paso) || PASOS_RESERVA[0]
  const porcentaje = Math.round((paso / PASOS_RESERVA.length) * 100)

  return (
    <div className="border-b border-line bg-surface">
      <div className="mx-auto max-w-3xl px-4 pb-3 pt-2">
        <div className="flex items-center justify-between text-xs text-ink-muted sm:hidden">
          <span>
            Paso <span className="font-semibold text-ink">{paso}</span> de {PASOS_RESERVA.length}
            <span className="text-ink-soft"> · </span>
            <span className="font-medium text-ink">{actual.label}</span>
          </span>
          <span className="font-tabular">{porcentaje}%</span>
        </div>

        <ol className="hidden items-center gap-1 sm:flex" aria-label="Progreso de la reserva">
          {PASOS_RESERVA.map((item, index) => {
            const completado = item.numero < paso
            const esActual = item.numero === paso
            return (
              <li key={item.numero} className="flex flex-1 items-center gap-1 last:flex-none">
                <div
                  className="flex items-center gap-2"
                  aria-current={esActual ? 'step' : undefined}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                      completado
                        ? 'bg-accent-400 text-white'
                        : esActual
                          ? 'bg-graphite-900 text-white'
                          : 'bg-graphite-100 text-ink-muted'
                    }`}
                  >
                    {completado
                      ? <Check className="h-3 w-3" aria-hidden="true" />
                      : item.numero}
                  </span>
                  <span
                    className={`whitespace-nowrap text-xs ${
                      esActual ? 'font-semibold text-ink' : 'text-ink-muted'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                {index < PASOS_RESERVA.length - 1 && (
                  <span
                    className={`mx-1 h-px flex-1 ${completado ? 'bg-accent-300' : 'bg-graphite-200'}`}
                    aria-hidden="true"
                  />
                )}
              </li>
            )
          })}
        </ol>

        <div className="mt-2 h-1 overflow-hidden rounded-full bg-graphite-100 sm:mt-3">
          <div
            className="h-full rounded-full bg-accent-400 transition-all duration-300"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>
    </div>
  )
}
