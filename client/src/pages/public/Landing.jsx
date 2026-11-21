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

      {/* ── Soluciones ── */}
      <section className="relative border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <FadeIn>
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-300">
              Soluciones AgendaCar
            </p>
            <h2 className="mt-3 text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Una plataforma. Más soluciones.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-white/50">
              Herramientas diseñadas para simplificar la operación y ayudarte a crecer.
            </p>
          </FadeIn>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">

            {/* Card — Agenda */}
            <FadeIn delay={80}>
              <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-400/15">
                    <svg className="h-5 w-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" />
                      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold">Agenda para talleres</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/55">
                  Gestiona reservas, servicios, clientes y horarios. Permite que tus clientes agenden online las 24 horas.
                </p>
                {/* Mini screenshot — agenda */}
                <div className="mt-5 flex-1 overflow-hidden rounded-xl border border-white/10 bg-[#0f1115] p-3 text-[11px]">
                  <div className="mb-2 flex items-center justify-between text-white/40">
                    <span className="font-semibold text-white/70">Reservas del día</span>
                    <span>Hoy, 21 nov</span>
                  </div>
                  {[
                    { hora: '09:00', cliente: 'Toyota Hilux', serv: 'Mantención', dur: '90 min', color: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' },
                    { hora: '10:30', cliente: 'Nissan Qashqai', serv: 'Frenos', dur: '60 min', color: 'bg-blue-500/20 border-blue-500/30 text-blue-300' },
                    { hora: '14:00', cliente: 'Hyundai Tucson', serv: 'Diagnóstico', dur: '45 min', color: 'bg-violet-500/20 border-violet-500/30 text-violet-300' },
                  ].map(r => (
                    <div key={r.hora} className="mb-1.5 flex items-center gap-2">
                      <span className="w-10 shrink-0 text-white/35">{r.hora}</span>
                      <div className={`flex flex-1 items-center justify-between rounded-md border px-2 py-1 ${r.color}`}>
                        <span className="font-medium">{r.cliente} · {r.serv}</span>
                        <span className="text-[10px] opacity-70">{r.dur}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Card — Flota */}
            <FadeIn delay={160}>
              <div className="flex h-full flex-col rounded-2xl border border-accent-400/40 bg-accent-400/[0.05] p-6 ring-1 ring-accent-400/20">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-400/15">
                    <svg className="h-5 w-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path d="M5 17H3a1 1 0 0 1-1-1v-5l2.5-5H17l2.5 5H22v5a1 1 0 0 1-1 1h-2" />
                      <circle cx="7.5" cy="17.5" r="2.5" />
                      <circle cx="16.5" cy="17.5" r="2.5" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold">Control de Flota</h3>
                  <span className="ml-auto shrink-0 rounded-full bg-accent-400/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-300">
                    Beta
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/55">
                  Administra vehículos, conductores, documentos y gastos de tu flota. Kilometraje, combustible, peajes y alertas de vencimiento en un solo lugar. Portal móvil para conductores incluido.
                </p>
                {/* Mini screenshot — flota */}
                <div className="mt-5 flex-1 overflow-hidden rounded-xl border border-white/10 bg-[#0f1115] p-3 text-[11px]">
                  <div className="mb-3 font-semibold text-white/70">Control de Flota</div>
                  <div className="mb-3 grid grid-cols-3 gap-2">
                    {[
                      { label: 'Vehículos', val: '24', color: 'text-white' },
                      { label: 'Operativos', val: '20', color: 'text-emerald-400' },
                      { label: 'En taller', val: '3', color: 'text-amber-400' },
                    ].map(s => (
                      <div key={s.label} className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-center">
                        <div className={`text-base font-bold ${s.color}`}>{s.val}</div>
                        <div className="text-[10px] text-white/40">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mb-1.5 flex items-center justify-between text-white/40">
                    <span>Gastos del mes</span>
                    <span className="font-semibold text-white/70">$2.845.000</span>
                  </div>
                  <div className="flex items-end gap-1 h-8">
                    {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm bg-accent-400/50"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </FadeIn>

          </div>
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
