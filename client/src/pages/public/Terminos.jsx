import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'

export default function Terminos() {
  useEffect(() => {
    document.title = 'Términos de Uso — AgendaCar'
  }, [])

  const hoy = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100">
            <FileText className="h-5 w-5 text-accent-600" />
          </div>
          <h1 className="text-2xl font-bold text-ink">Términos de Uso</h1>
        </div>
        <p className="text-sm text-ink-muted mb-8">Última actualización: {hoy}</p>

        <div className="prose prose-sm max-w-none space-y-8 text-ink">

          <section>
            <h2 className="text-base font-bold text-ink mb-2">1. Partes y definiciones</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              <strong>AgendaCar</strong>: plataforma SaaS de agendamiento en línea para talleres automotrices,
              operada por ClauNet.<br />
              <strong>Taller</strong>: empresa o persona natural que contrata el uso de AgendaCar para gestionar
              sus reservas.<br />
              <strong>Cliente</strong>: persona natural que realiza una reserva a través de la plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink mb-2">2. Objeto del servicio</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              AgendaCar provee al <strong>Taller</strong> una herramienta digital para recibir, gestionar y
              hacer seguimiento de reservas de servicios automotrices. El <strong>Cliente</strong> usa la
              plataforma para agendar horas de atención en el taller de su elección.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink mb-2">3. Uso del servicio — Talleres</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm text-ink-muted">
              <li>El Taller es responsable de mantener actualizada su información (horarios, servicios, precios).</li>
              <li>El Taller es responsable del trato de los datos de sus clientes conforme a la Ley N° 21.719.</li>
              <li>Está prohibido usar la plataforma para fines ilícitos o que infrinjan derechos de terceros.</li>
              <li>El Taller no puede ceder ni compartir sus credenciales de acceso.</li>
              <li>AgendaCar se reserva el derecho de suspender cuentas que incumplan estos términos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink mb-2">4. Uso del servicio — Clientes</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm text-ink-muted">
              <li>El Cliente debe proporcionar datos verídicos al realizar una reserva.</li>
              <li>La reserva es un acuerdo entre el Cliente y el Taller; AgendaCar actúa como intermediario tecnológico.</li>
              <li>El incumplimiento reiterado de reservas (no presentarse sin avisar) puede resultar en restricciones a criterio del Taller.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink mb-2">5. Disponibilidad del servicio</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              AgendaCar procura mantener el servicio disponible de forma continua, pero no garantiza
              disponibilidad ininterrumpida. Pueden existir períodos de mantenimiento programado o
              interrupciones por causas ajenas a nuestro control (fallas de proveedores de infraestructura,
              fuerza mayor, etc.). No nos hacemos responsables por pérdidas derivadas de interrupciones del servicio.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink mb-2">6. Propiedad intelectual</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              El código, diseño, marca y contenidos de AgendaCar son propiedad de ClauNet y están protegidos
              por la legislación chilena de propiedad intelectual. Queda prohibida su reproducción total o
              parcial sin autorización expresa.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink mb-2">7. Limitación de responsabilidad</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              AgendaCar no es parte en la relación contractual entre el Taller y el Cliente. Las disputas
              sobre calidad del servicio automotriz, incumplimiento de citas o cobros son responsabilidad
              exclusiva del Taller. AgendaCar no responde por daños indirectos, lucro cesante ni pérdida
              de datos atribuible al Taller o al Cliente.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink mb-2">8. Datos personales</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              El tratamiento de datos personales se rige por nuestra{' '}
              <Link to="/privacidad" className="text-accent-600 hover:underline">Política de Privacidad</Link>,
              que forma parte integrante de estos Términos de Uso, y por la Ley N° 21.719 sobre Protección
              de Datos Personales.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink mb-2">9. Planes y pagos</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Los planes de suscripción, precios y condiciones de pago se informan directamente al Taller
              al momento de la contratación. El incumplimiento de pago puede derivar en la suspensión del
              acceso a la plataforma. AgendaCar notificará al Taller con al menos 5 días hábiles de anticipación
              antes de ejecutar una suspensión por mora.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink mb-2">10. Modificaciones de los términos</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Nos reservamos el derecho de modificar estos Términos. Los cambios serán comunicados al Taller
              con al menos 30 días de anticipación. El uso continuado del servicio tras esa fecha implica
              aceptación de los nuevos términos.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink mb-2">11. Ley aplicable y jurisdicción</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Estos Términos se rigen por la legislación de la <strong>República de Chile</strong>. Para
              cualquier controversia, las partes se someten a la jurisdicción de los tribunales ordinarios
              de justicia de Chile, con renuncia a cualquier otro fuero.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink mb-2">12. Contacto</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Consultas:{' '}
              <a href="mailto:contacto@agendacar.cl" className="text-accent-600 hover:underline">contacto@agendacar.cl</a>
            </p>
          </section>

        </div>

        <div className="mt-10 border-t border-line pt-6 flex flex-wrap gap-4 text-xs text-ink-soft">
          <Link to="/privacidad" className="hover:text-ink hover:underline">Política de privacidad</Link>
          <Link to="/" className="hover:text-ink hover:underline">Volver al inicio</Link>
        </div>
      </div>
    </div>
  )
}
