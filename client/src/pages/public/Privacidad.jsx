import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'

export default function Privacidad() {
  useEffect(() => {
    document.title = 'Política de Privacidad — AgendaCar'
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
            <Shield className="h-5 w-5 text-accent-600" />
          </div>
          <h1 className="text-2xl font-bold text-ink">Política de Privacidad</h1>
        </div>
        <p className="text-sm text-ink-muted mb-8">Última actualización: {hoy}</p>

        <div className="prose prose-sm max-w-none space-y-8 text-ink">

          <section>
            <h2 className="text-base font-bold text-ink mb-2">1. Responsable del tratamiento</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              <strong>AgendaCar</strong>, plataforma de agendamiento en línea para talleres automotrices, operada por
              ClauNet (en adelante "AgendaCar", "nosotros" o "el responsable"), con contacto en{' '}
              <a href="mailto:contacto@agendacar.cl" className="text-accent-600 hover:underline">contacto@agendacar.cl</a>.
            </p>
            <p className="text-sm text-ink-muted leading-relaxed mt-2">
              Cada taller que utiliza la plataforma actúa como <strong>responsable del tratamiento</strong> de los
              datos de sus propios clientes, en los términos del artículo 5 de la Ley N° 21.719.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink mb-2">2. Marco legal aplicable</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              El tratamiento de datos personales se rige por la <strong>Ley N° 21.719</strong> sobre Protección
              de Datos Personales (publicada en el Diario Oficial el 13 de diciembre de 2024), que moderniza
              y reemplaza la Ley N° 19.628, adecuando la normativa chilena a estándares internacionales de
              protección de datos.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink mb-2">3. Datos que recopilamos</h2>
            <p className="text-sm text-ink-muted leading-relaxed mb-2">Al realizar una reserva en la plataforma, se solicitan los siguientes datos:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-ink-muted">
              <li><strong>Nombre completo</strong> — para identificar al cliente en la reserva.</li>
              <li><strong>Número de teléfono</strong> — para confirmaciones y comunicaciones relacionadas con la cita.</li>
              <li><strong>Correo electrónico</strong> (opcional) — para envío de confirmación o recordatorios.</li>
              <li><strong>Patente del vehículo</strong> — para registro del servicio automotriz.</li>
              <li><strong>Información del vehículo</strong> (marca, modelo, año, kilometraje) — para historial de servicio.</li>
            </ul>
            <p className="text-sm text-ink-muted leading-relaxed mt-2">
              No recopilamos datos sensibles en el sentido del artículo 4 de la Ley N° 21.719 (datos de salud,
              biometría, origen racial, opiniones políticas, etc.).
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink mb-2">4. Finalidad del tratamiento</h2>
            <p className="text-sm text-ink-muted leading-relaxed mb-2">Los datos se tratan exclusivamente para:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-ink-muted">
              <li>Gestionar y confirmar reservas de servicios automotrices.</li>
              <li>Permitir al taller comunicarse con el cliente sobre su cita.</li>
              <li>Mantener historial de servicios del vehículo.</li>
              <li>Enviar recordatorios o confirmaciones de la reserva.</li>
            </ul>
            <p className="text-sm text-ink-muted leading-relaxed mt-2">
              Los datos <strong>no serán utilizados con fines publicitarios, comerciales de terceros ni
              cedidos a otras empresas</strong>, salvo obligación legal.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink mb-2">5. Base de legitimación</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              El tratamiento se funda en el <strong>consentimiento del titular</strong> (artículo 12 de la
              Ley N° 21.719), otorgado al completar el formulario de reserva, y en la <strong>ejecución de
              la relación contractual</strong> entre el cliente y el taller.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink mb-2">6. Plazo de conservación</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Los datos se conservan mientras sea necesario para la prestación del servicio y el historial
              del vehículo, o hasta que el titular solicite su supresión. En ningún caso se mantendrán
              por más de <strong>5 años</strong> desde la última reserva activa, salvo obligación legal en contrario.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink mb-2">7. Derechos del titular (ARCOP)</h2>
            <p className="text-sm text-ink-muted leading-relaxed mb-2">
              Conforme a los artículos 20 y siguientes de la Ley N° 21.719, el titular de los datos tiene derecho a:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-ink-muted">
              <li><strong>Acceso</strong> — conocer qué datos personales suyos se tratan.</li>
              <li><strong>Rectificación</strong> — corregir datos inexactos o incompletos.</li>
              <li><strong>Cancelación/Supresión</strong> — solicitar la eliminación de sus datos.</li>
              <li><strong>Oposición</strong> — oponerse al tratamiento en los casos previstos por la ley.</li>
              <li><strong>Portabilidad</strong> — recibir sus datos en formato estructurado y de uso común.</li>
            </ul>
            <p className="text-sm text-ink-muted leading-relaxed mt-2">
              Para ejercer estos derechos, contacte al taller directamente o a AgendaCar en{' '}
              <a href="mailto:contacto@agendacar.cl" className="text-accent-600 hover:underline">contacto@agendacar.cl</a>.
              Responderemos dentro del plazo legal de <strong>30 días hábiles</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink mb-2">8. Cookies y tecnologías similares</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              AgendaCar <strong>no utiliza cookies de rastreo ni de publicidad</strong>. Únicamente se emplea
              almacenamiento local del navegador (<em>localStorage</em>) para mantener la sesión autenticada
              del administrador del taller. Este dato no se transmite a terceros y se elimina al cerrar sesión.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink mb-2">9. Seguridad de los datos</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Adoptamos medidas técnicas y organizativas adecuadas para proteger los datos personales frente
              a accesos no autorizados, pérdida o destrucción, incluyendo transmisión cifrada (HTTPS),
              contraseñas hasheadas y acceso restringido a la base de datos. Sin perjuicio de lo anterior,
              ningún sistema de seguridad es infalible.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink mb-2">10. Transferencias internacionales</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Los datos se almacenan en servidores de <strong>Neon Inc.</strong> (base de datos PostgreSQL,
              EE. UU.) y <strong>Render Inc.</strong> (servidor de aplicación, EE. UU.), proveedores que
              cuentan con estándares de seguridad compatibles con la normativa aplicable. No realizamos
              transferencias internacionales con fines distintos a la operación del servicio.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink mb-2">11. Autoridad de control</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              La Ley N° 21.719 crea la <strong>Agencia de Protección de Datos Personales</strong> de Chile,
              ante la cual podrá presentar reclamos una vez que la Agencia entre en funcionamiento. Mientras
              tanto, puede acudir a los tribunales ordinarios de justicia.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink mb-2">12. Modificaciones</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Nos reservamos el derecho de actualizar esta política. Los cambios relevantes serán comunicados
              con al menos 30 días de anticipación. La versión vigente siempre estará disponible en esta página.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink mb-2">13. Contacto</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Para consultas sobre privacidad o ejercicio de derechos:{' '}
              <a href="mailto:contacto@agendacar.cl" className="text-accent-600 hover:underline">contacto@agendacar.cl</a>
            </p>
          </section>

        </div>

        <div className="mt-10 border-t border-line pt-6 flex flex-wrap gap-4 text-xs text-ink-soft">
          <Link to="/terminos" className="hover:text-ink hover:underline">Términos de uso</Link>
          <Link to="/" className="hover:text-ink hover:underline">Volver al inicio</Link>
        </div>
      </div>
    </div>
  )
}
