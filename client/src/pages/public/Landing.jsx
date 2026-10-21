import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock,
  Contact2,
  MessageCircle,
  MonitorCheck,
  Wrench
} from 'lucide-react'
import useDocumentTitle from '../../hooks/useDocumentTitle'

const FEATURES = [
  {
    icon: CalendarDays,
    title: 'Agenda online 24/7',
    desc: 'Tus clientes reservan cuando quieren, sin llamadas ni mensajes.'
  },
  {
    icon: Clock,
    title: 'Horarios flexibles',
    desc: 'Configura días, horarios y duración de servicios según tu taller.'
  },
  {
    icon: Wrench,
    title: 'Servicios a medida',
    desc: 'Define los servicios que ofreces y el tiempo que toma cada uno.'
  },
  {
    icon: MonitorCheck,
    title: 'Panel de control',
    desc: 'Revisa reservas del día, historial y estadísticas en un solo lugar.'
  },
  {
    icon: Contact2,
    title: 'Gestión de clientes',
    desc: 'Registro automático de clientes y sus vehículos con cada reserva.'
  },
  {
    icon: CheckCircle2,
    title: 'Confirmaciones automáticas',
    desc: 'El taller recibe notificación por cada nueva reserva ingresada.'
  }
]

const WS_URL = 'https://wa.me/56982540503?text=Hola%2C%20quiero%20saber%20m%C3%A1s%20sobre%20AgendaCar'

export default function Landing() {
  useDocumentTitle('AgendaCar — Software de agendamiento para talleres')

  return (
    <div className="min-h-screen bg-graphite-950 text-white">
      {/* Grilla de fondo */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(#8C939D 1px, transparent 1px), linear-gradient(90deg, #8C939D 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }}
        aria-hidden="true"
      />

      {/* Nav */}
      <header className="relative border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-400 text-white">
              <Car className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="text-base font-bold tracking-tight">AgendaCar</span>
          </div>
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Acceder al panel
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-6 py-20 text-center sm:py-28">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-300">
          Software para talleres automotrices
        </p>
        <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
          Tu taller,{' '}
          <span className="text-accent-400">organizado</span>
          <br />y siempre disponible.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
          AgendaCar permite a tus clientes reservar hora online en cualquier momento.
          Tú administras todo desde un panel simple y rápido.
        </p>
        <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
          <a
            href={WS_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-accent-400 px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-500"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Solicitar demo por WhatsApp
          </a>
          <Link
            to="/admin/login"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 px-6 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/5"
          >
            Acceder a mi panel
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="relative mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-3 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-center gap-5 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-400/15 text-accent-300">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-white/50">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="relative border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            ¿Listo para modernizar tu taller?
          </h2>
          <p className="mt-3 text-white/50">
            Escríbenos y te configuramos en menos de 24 horas.
          </p>
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
            <a
              href={WS_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-accent-400 px-8 py-3 text-sm font-semibold text-white transition hover:bg-accent-500"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Contactar por WhatsApp
            </a>
            <a
              href="mailto:claudio@claunet.cl?subject=Quiero%20probar%20AgendaCar"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 px-8 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/5"
            >
              Enviar un correo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-6 text-center text-xs text-white/30">
          © {new Date().getFullYear()} AgendaCar ·{' '}
          <a
            href="https://claunet.cl"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-white/50"
          >
            Desarrollado por ClauNet
          </a>
        </div>
      </footer>
    </div>
  )
}
