import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Car, MessageCircle } from 'lucide-react'
import {
  IconCalendarCheck,
  IconClockHands,
  IconCrossedTools,
  IconGrid2x2,
  IconPersonCar,
  IconBellCheck,
} from '../../components/public/FeatureIcons'
import useDocumentTitle from '../../hooks/useDocumentTitle'

/* ── Hook fade-in al scroll ── */
function useFadeIn(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

function FadeIn({ children, delay = 0, className = '' }) {
  const [ref, visible] = useFadeIn()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`
      }}
    >
      {children}
    </div>
  )
}

/* ── Datos ── */
const FEATURES = [
  { icon: IconCalendarCheck, title: 'Agenda online 24/7',         desc: 'Tus clientes reservan cuando quieren, sin llamadas ni mensajes.' },
  { icon: IconClockHands,    title: 'Horarios flexibles',         desc: 'Configura días, horarios y duración de servicios según tu taller.' },
  { icon: IconCrossedTools,  title: 'Servicios a medida',         desc: 'Define los servicios que ofreces y el tiempo que toma cada uno.' },
  { icon: IconGrid2x2,       title: 'Panel de control',           desc: 'Revisa reservas del día, historial y estadísticas en un solo lugar.' },
  { icon: IconPersonCar,     title: 'Gestión de clientes',        desc: 'Registro automático de clientes y sus vehículos con cada reserva.' },
  { icon: IconBellCheck,     title: 'Confirmaciones automáticas', desc: 'El taller recibe notificación por cada nueva reserva ingresada.' }
]

const ROTATING_WORDS = ['organizado', 'moderno', 'en control', 'eficiente', 'sin papel']
const WS_URL = 'https://wa.me/56982540503?text=Hola%2C%20quiero%20saber%20m%C3%A1s%20sobre%20AgendaCar'

export default function Landing() {
  useDocumentTitle('AgendaCar — Software de agendamiento para talleres')

  /* Rotación de palabras */
  const [wordIndex, setWordIndex] = useState(0)
  const [fadeWord, setFadeWord] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeWord(false)
      setTimeout(() => {
        setWordIndex(i => (i + 1) % ROTATING_WORDS.length)
        setFadeWord(true)
      }, 400)
    }, 2800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-graphite-950 text-white">

      {/* ── Keyframes globales ── */}
      <style>{`
        @keyframes hero-in  { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
        @keyframes hero-in2 { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── Grilla de fondo ── */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(#8C939D 1px, transparent 1px), linear-gradient(90deg, #8C939D 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }}
        aria-hidden="true"
      />

      {/* ── Nav ── */}
      <header className="relative border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5" style={{animation:'hero-in 0.5s ease both'}}>
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-400 text-white">
              <Car className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="text-base font-bold tracking-tight">AgendaCar</span>
          </div>
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-white/10 hover:border-white/40"
            style={{animation:'hero-in 0.5s ease 0.1s both'}}
          >
            Acceder al panel
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative mx-auto max-w-6xl px-6 py-20 text-center sm:py-28">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-300"
          style={{animation:'hero-in 0.6s ease 0.2s both'}}
        >
          Software para talleres automotrices
        </p>
        <h1
          className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl"
          style={{animation:'hero-in 0.7s ease 0.35s both'}}
        >
          Tu taller,{' '}
          <span
            className="text-accent-400"
            style={{
              display:'inline-block',
              opacity: fadeWord ? 1 : 0,
              transform: fadeWord ? 'translateY(0)' : 'translateY(-8px)',
              transition:'opacity 0.4s ease, transform 0.4s ease'
            }}
          >
            {ROTATING_WORDS[wordIndex]}
          </span>
          <br />y siempre disponible.
        </h1>
        <p
          className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg"
          style={{animation:'hero-in2 0.7s ease 0.55s both'}}
        >
          AgendaCar permite a tus clientes reservar hora online en cualquier momento.
          Tú administras todo desde un panel simple y rápido.
        </p>
        <div
          className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center"
          style={{animation:'hero-in2 0.7s ease 0.7s both'}}
        >
          <a
            href={WS_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-accent-400 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-500 hover:scale-[1.02] hover:shadow-lg hover:shadow-accent-500/25"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Solicitar demo por WhatsApp
          </a>
          <Link
            to="/admin/login"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 px-6 py-3 text-sm font-semibold text-white/80 transition-all duration-200 hover:bg-white/5 hover:border-white/40 hover:text-white"
          >
            Acceder a mi panel
          </Link>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-3 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <FadeIn key={title} delay={i * 80}>
              <div className="group flex items-center gap-5 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4 transition-all duration-300 hover:-translate-y-1 hover:border-accent-400/30 hover:bg-white/[0.07] hover:shadow-lg hover:shadow-accent-400/5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-10 w-10" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-white/50">{desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="relative border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <FadeIn>
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
                className="inline-flex items-center justify-center gap-2 rounded-md bg-accent-400 px-8 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-500 hover:scale-[1.02] hover:shadow-lg hover:shadow-accent-500/25"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Contactar por WhatsApp
              </a>
              <a
                href="mailto:claudio@claunet.cl?subject=Quiero%20probar%20AgendaCar"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 px-8 py-3 text-sm font-semibold text-white/80 transition-all duration-200 hover:bg-white/5 hover:border-white/40 hover:text-white"
              >
                Enviar un correo
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ── */}
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
