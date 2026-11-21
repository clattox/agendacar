// components/flota/NuevaActividad.jsx
import { useState } from 'react'
import { useRegistrarActividad } from '../../hooks/useFlota'

const TIPOS = [
  { id: 'TRASLADO',      label: 'Traslado',      desc: 'Viaje o comisión'          },
  { id: 'KILOMETRAJE',   label: 'Kilometraje',   desc: 'Lectura de odómetro'       },
  { id: 'COMBUSTIBLE',   label: 'Combustible',   desc: 'Litros, monto, estación'   },
  { id: 'PEAJE',         label: 'Peaje',         desc: 'Autopista, sentido, monto' },
  { id: 'MANTENCION',    label: 'Mantención',    desc: 'Tipo, taller, costo'       },
  { id: 'CAMBIO_ESTADO', label: 'Cambiar estado', desc: 'Operativo / Taller / FS'  },
]

const TIPOS_MANTENCION = [
  { value: 'CAMBIO_ACEITE',       label: 'Cambio de aceite y filtro' },
  { value: 'CAMBIO_FILTROS',      label: 'Cambio de filtros (aire, combustible)' },
  { value: 'NEUMATICOS',          label: 'Cambio de neumáticos' },
  { value: 'FRENOS',              label: 'Revisión / cambio de frenos' },
  { value: 'BATERIA',             label: 'Cambio de batería' },
  { value: 'CORREA_DISTRIBUCION', label: 'Correa de distribución' },
  { value: 'MANTENCION_GENERAL',  label: 'Mantención general' },
  { value: 'REVISION_TECNICA',    label: 'Revisión técnica (RT)' },
  { value: 'PERMISO_CIRCULACION', label: 'Permiso de circulación' },
  { value: 'SOAP',                label: 'SOAP' },
  { value: 'SEGURO_VOLUNTARIO',   label: 'Seguro del vehículo' },
  { value: 'OTRO',                label: 'Otro (especificar)' },
]

export default function NuevaActividad({ vehiculo, onClose, onSuccess }) {
  const [tipo,          setTipo]          = useState('TRASLADO')
  const [form,          setForm]          = useState({})
  const [submitted,     setSubmitted]     = useState(false)
  const [validationErr, setValidationErr] = useState('')

  const { loading, error, execute } = useRegistrarActividad()
  const hoy = new Date().toISOString().slice(0, 10)

  function set(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    setValidationErr('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setValidationErr('')

    if (tipo === 'TRASLADO'      && !form.destino)                              return setValidationErr('Ingresa el destino del traslado')
    if (tipo === 'KILOMETRAJE'   && !form.odometroActual)                       return setValidationErr('Ingresa el odómetro actual')
    if (tipo === 'COMBUSTIBLE'   && (!form.tipoCombustible || !form.monto))                 return setValidationErr('Completa tipo y monto')
    if (tipo === 'PEAJE'         && !form.esTag && !form.monto)                 return setValidationErr('Ingresa el monto del peaje o marca que es con tag')
    if (tipo === 'MANTENCION'    && !form.tipoMantencion)                       return setValidationErr('Selecciona el tipo de mantención')
    if (tipo === 'CAMBIO_ESTADO' && !form.estadoNuevo)                          return setValidationErr('Selecciona el nuevo estado')

    try {
      await execute({
        vehiculoId: vehiculo.id,
        tipo,
        fecha: form.fecha || hoy,
        notas: form.notas,
        ...buildDetalle(tipo, form),
      })
      setSubmitted(true)
    } catch {
      // error visible desde hook
    }
  }

  if (submitted) {
    return (
      <Overlay onClose={onClose}>
        <div className="flex flex-col items-center gap-4 py-10 text-center px-6">
          <div className="w-14 h-14 rounded-full bg-[#DCFCE7] border-2 border-[#86EFAC] flex items-center justify-center">
            <svg className="w-7 h-7 text-[#16A34A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-[#252A31]">Registro guardado</h3>
          <p className="text-sm text-[#737B86]">
            {TIPOS.find(t => t.id === tipo)?.label} registrado para {vehiculo.marca}
          </p>
          <div className="flex gap-3 mt-2">
            <button onClick={() => { setSubmitted(false); setForm({}) }} className="btn-ghost">
              Registrar otra
            </button>
            <button onClick={onSuccess} className="btn-primary">
              Volver a la lista
            </button>
          </div>
        </div>
      </Overlay>
    )
  }

  return (
    <Overlay onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E1E4E8]">
        <div>
          <h2 className="font-bold text-[#252A31] text-base">Nueva actividad</h2>
          <p className="text-xs text-[#737B86] mt-0.5 font-mono">{vehiculo.marca} · {vehiculo.patente}</p>
        </div>
        <button type="button" onClick={onClose} className="text-[#737B86] hover:text-[#252A31] p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto max-h-[70vh]">
        {/* Selector de tipo */}
        <div className="p-5 border-b border-[#E1E4E8]">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {TIPOS.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => { setTipo(t.id); setForm({}) }}
                className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-center transition-all
                  ${tipo === t.id
                    ? 'border-amber-500 bg-amber-50 text-amber-600'
                    : 'border-[#E1E4E8] bg-[#F4F5F6] text-[#737B86] hover:border-[#C6CAD0]'}`}
              >
                <span className="text-xs font-semibold leading-tight">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Fecha común */}
        <div className="px-5 pt-4">
          <Field label="Fecha">
            <input type="date" defaultValue={hoy} onChange={e => set('fecha', e.target.value)} className="input" />
          </Field>
        </div>

        {/* Formularios por tipo */}
        <div className="px-5 py-4 flex flex-col gap-4">
          {tipo === 'TRASLADO'      && <FormTraslado form={form} set={set} odometroActual={vehiculo.odometroActual ?? 0} />}
          {tipo === 'KILOMETRAJE'   && <FormKm    form={form} set={set} odometroActual={vehiculo.odometroActual ?? 0} />}
          {tipo === 'COMBUSTIBLE'   && <FormComb  form={form} set={set} />}
          {tipo === 'PEAJE'         && <FormPeaje form={form} set={set} tieneTag={!!vehiculo.tieneTag} />}
          {tipo === 'MANTENCION'    && <FormMant  form={form} set={set} />}
          {tipo === 'CAMBIO_ESTADO' && <FormEstado form={form} set={set} />}

          <Field label="Notas (opcional)">
            <textarea rows={2} onChange={e => set('notas', e.target.value)}
              className="input resize-none" placeholder="Observaciones…" />
          </Field>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#E1E4E8] flex items-center justify-between gap-3">
          <div className="text-xs text-red-500">{validationErr || (error && `Error: ${error}`)}</div>
          <div className="flex gap-2 ml-auto">
            <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Guardando…' : 'Guardar registro'}
            </button>
          </div>
        </div>
      </form>
    </Overlay>
  )
}

// ——— Formularios por tipo ——————————————————————————————————————

function FormTraslado({ form, set, odometroActual }) {
  const kmRecorridos = form.kmSalida && form.kmLlegada
    ? form.kmLlegada - form.kmSalida
    : null

  return (
    <>
      <Field label="Destino *">
        <input
          type="text"
          className="input"
          placeholder="Concepción, Los Ángeles…"
          value={form.destino ?? ''}
          onChange={e => set('destino', e.target.value)}
        />
      </Field>

      <Field label="Motivo / comisión">
        <input
          type="text"
          className="input"
          placeholder="Audiencia Tribunal de Familia, reunión regional…"
          value={form.motivo ?? ''}
          onChange={e => set('motivo', e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Km salida" hint={`actual: ${odometroActual.toLocaleString('es-CL')}`}>
          <div className="relative">
            <input type="number" className="input pr-8" placeholder={String(odometroActual)}
              value={form.kmSalida ?? ''}
              onChange={e => set('kmSalida', e.target.value ? Number(e.target.value) : '')} />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#737B86]">km</span>
          </div>
        </Field>
        <Field label="Km llegada">
          <div className="relative">
            <input type="number" className="input pr-8"
              value={form.kmLlegada ?? ''}
              onChange={e => set('kmLlegada', e.target.value ? Number(e.target.value) : '')} />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#737B86]">km</span>
          </div>
        </Field>
        <Field label="Km recorridos" hint="calculado">
          <input readOnly
            value={kmRecorridos != null ? `${kmRecorridos.toLocaleString('es-CL')} km` : '—'}
            className="input bg-amber-50 text-amber-600 border-transparent cursor-default" />
        </Field>
      </div>
    </>
  )
}

function FormKm({ form, set, odometroActual }) {
  const nuevo   = form.odometroActual ? Number(form.odometroActual) : null
  const kmDiff  = nuevo != null ? nuevo - odometroActual : null

  return (
    <div className="grid grid-cols-2 gap-4">
      <Field label="Odómetro actual *" hint={`Último: ${odometroActual.toLocaleString('es-CL')} km`}>
        <input type="number" className="input" placeholder={String(odometroActual + 100)}
          onChange={e => set('odometroActual', Number(e.target.value))} />
      </Field>
      <Field label="Km recorridos" hint="calculado">
        <input readOnly
          value={kmDiff != null ? `+${kmDiff.toLocaleString('es-CL')} km` : '—'}
          className="input bg-amber-50 text-amber-600 border-transparent cursor-default" />
      </Field>
    </div>
  )
}

function FormComb({ form, set }) {
  const precioLitro = form.litros && form.monto
    ? Math.round(form.monto / form.litros)
    : null

  return (
    <>
      <div>
        <label className="field-label">Tipo de combustible *</label>
        <div className="flex gap-2 mt-1.5">
          {[['DIESEL','Diesel'],['BENCINA_93','93'],['BENCINA_95','95'],['BENCINA_97','97']].map(([v, l]) => (
            <button key={v} type="button" onClick={() => set('tipoCombustible', v)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all
                ${form.tipoCombustible === v
                  ? 'border-[#86EFAC] bg-[#DCFCE7] text-[#16A34A]'
                  : 'border-[#E1E4E8] bg-[#F4F5F6] text-[#737B86] hover:border-[#C6CAD0]'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Litros" hint="opcional">
          <div className="relative">
            <input type="number" className="input pr-7" placeholder="42"
              value={form.litros ?? ''}
              onChange={e => set('litros', e.target.value ? Number(e.target.value) : '')} />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#737B86]">L</span>
          </div>
        </Field>
        <Field label="Monto total *">
          <div className="relative">
            <input type="number" className="input pr-5" placeholder="74000"
              onChange={e => set('monto', Number(e.target.value))} />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#737B86]">$</span>
          </div>
        </Field>
        <Field label="Precio/L" hint="calculado">
          <input readOnly value={precioLitro ? `$${precioLitro.toLocaleString('es-CL')}/L` : '—'}
            className="input bg-amber-50 text-amber-600 border-transparent cursor-default" />
        </Field>
      </div>
      {!form.litros && (
        <p className="text-xs text-[#A0A6AE] -mt-2">
          💡 Agrega los litros para ver el consumo del vehículo
        </p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Estación de servicio">
          <input type="text" className="input" placeholder="Copec"
            value={form.estacion ?? 'Copec'}
            onChange={e => set('estacion', e.target.value)} />
        </Field>
        <Field label="Odómetro al cargar">
          <div className="relative">
            <input type="number" className="input pr-8" placeholder="87420"
              onChange={e => set('odometroAlCargar', Number(e.target.value))} />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#737B86]">km</span>
          </div>
        </Field>
      </div>
    </>
  )
}

function FormPeaje({ form, set, tieneTag }) {
  // Auto-inicializar esTag si el vehículo tiene tag y aún no se ha tocado el toggle
  if (tieneTag && form.esTag === undefined) {
    // Usar setTimeout para evitar mutación durante render
    setTimeout(() => set('esTag', true), 0)
  }
  const esTag = form.esTag !== undefined ? !!form.esTag : !!tieneTag
  return (
    <>
      {/* Toggle Tag */}
      <button
        type="button"
        onClick={() => { set('esTag', !esTag); if (!esTag) set('monto', '') }}
        className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border transition-all text-left
          ${esTag
            ? 'border-blue-200 bg-blue-50 text-blue-600'
            : 'border-[#E1E4E8] bg-[#F4F5F6] text-[#737B86] hover:border-[#C6CAD0]'}`}
      >
        {/* Icono tag (chip/transponder) */}
        <svg className={`w-5 h-5 flex-shrink-0 ${esTag ? 'text-blue-600' : 'text-[#737B86]'}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
          <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
        </svg>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold">Pagado con Tag electrónico</div>
          <div className={`text-xs mt-0.5 ${esTag ? 'text-blue-500' : 'text-[#A0A6AE]'}`}>
            {esTag
              ? 'El administrador cargará el monto desde el estado de cuenta'
              : 'Activar si el peaje fue cobrado por telepeaje / Tag'}
          </div>
        </div>
        <div className={`w-9 h-5 rounded-full flex-shrink-0 relative transition-colors ${esTag ? 'bg-blue-500' : 'bg-[#D1D5DB]'}`}>
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${esTag ? 'left-4' : 'left-0.5'}`} />
        </div>
      </button>

      {/* Monto: oculto si es tag */}
      {!esTag && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Monto *">
            <div className="relative">
              <input type="number" className="input pr-5" placeholder="16000"
                onChange={e => set('monto', Number(e.target.value))} />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#737B86]">$</span>
            </div>
          </Field>
          <Field label="Autopista / ruta">
            <input type="text" className="input" placeholder="Ruta 5 Sur…"
              onChange={e => set('autopista', e.target.value)} />
          </Field>
        </div>
      )}

      {/* Autopista visible aunque sea tag */}
      {esTag && (
        <Field label="Autopista / ruta (opcional)">
          <input type="text" className="input" placeholder="Ruta 5 Sur, Autopista Central…"
            onChange={e => set('autopista', e.target.value)} />
        </Field>
      )}

      <div>
        <label className="field-label">Sentido del viaje</label>
        <div className="flex gap-2 mt-1.5">
          {[['IDA','Ida'],['VUELTA','Vuelta'],['IDA_Y_VUELTA','Ida y vuelta']].map(([v, l]) => (
            <button key={v} type="button" onClick={() => set('sentido', v)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all
                ${form.sentido === v
                  ? 'border-amber-500 bg-amber-50 text-amber-600'
                  : 'border-[#E1E4E8] bg-[#F4F5F6] text-[#737B86] hover:border-[#C6CAD0]'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

function FormMant({ form, set }) {
  return (
    <>
      <Field label="Tipo de mantención *">
        <select className="input" onChange={e => set('tipoMantencion', e.target.value)}>
          <option value="">Seleccionar…</option>
          {TIPOS_MANTENCION.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Taller / proveedor">
          <input type="text" className="input" placeholder="Taller Torres…"
            onChange={e => set('taller', e.target.value)} />
        </Field>
        <Field label="Costo">
          <div className="relative">
            <input type="number" className="input pr-5" placeholder="18000"
              onChange={e => set('costo', Number(e.target.value))} />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#737B86]">$</span>
          </div>
        </Field>
        <Field label="N° folio / boleta">
          <input type="text" className="input" placeholder="0012345"
            onChange={e => set('numeroFolio', e.target.value)} />
        </Field>
        <Field label="Odómetro actual">
          <div className="relative">
            <input type="number" className="input pr-8" placeholder="87420"
              onChange={e => set('odometro', Number(e.target.value))} />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#737B86]">km</span>
          </div>
        </Field>
        <Field label="Próxima fecha">
          <input type="date" className="input" onChange={e => set('proxFecha', e.target.value)} />
        </Field>
        <Field label="Próximo km">
          <div className="relative">
            <input type="number" className="input pr-8" placeholder="92420"
              onChange={e => set('proxKm', Number(e.target.value))} />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#737B86]">km</span>
          </div>
        </Field>
      </div>
    </>
  )
}

function FormEstado({ form, set }) {
  const enTaller = form.estadoNuevo === 'EN_TALLER'
  return (
    <>
      <div>
        <label className="field-label">Nuevo estado *</label>
        <div className="flex gap-2 mt-1.5">
          {[
            ['OPERATIVO',         'Operativo',         'text-[#16A34A] bg-[#DCFCE7] border-[#86EFAC]'],
            ['EN_TALLER',         'En taller',          'text-[#D97706] bg-[#FEF3C7] border-[#FCD34D]'],
            ['FUERA_DE_SERVICIO', 'Fuera de servicio',  'text-[#DC2626] bg-[#FEE2E2] border-[#FCA5A5]'],
          ].map(([v, l, cls]) => (
            <button key={v} type="button" onClick={() => set('estadoNuevo', v)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all
                ${form.estadoNuevo === v ? cls : 'border-[#E1E4E8] bg-[#F4F5F6] text-[#737B86] hover:border-[#C6CAD0]'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <Field label="Motivo">
        <input type="text" className="input" placeholder="Ej: ingresa a taller por revisión de frenos…"
          onChange={e => set('motivo', e.target.value)} />
      </Field>
      {enTaller && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre del taller">
            <input type="text" className="input" placeholder="Automotriz…"
              onChange={e => set('tallerNombre', e.target.value)} />
          </Field>
          <Field label="Retorno estimado">
            <input type="date" className="input"
              onChange={e => set('fechaRetornoEstimada', e.target.value)} />
          </Field>
        </div>
      )}
    </>
  )
}

// ——— UI helpers —————————————————————————————————————————————

function Overlay({ onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E1E4E8] rounded-2xl w-full max-w-xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center text-xs font-semibold text-[#737B86]">
        {label}
        {hint && <span className="ml-auto font-normal text-[#A0A6AE]">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

// ——— Helper: construir payload de detalle por tipo —————————————

function buildDetalle(tipo, form) {
  switch (tipo) {
    case 'TRASLADO':
      return {
        destino:   form.destino,
        motivo:    form.motivo    || undefined,
        kmSalida:  form.kmSalida  || undefined,
        kmLlegada: form.kmLlegada || undefined,
      }
    case 'KILOMETRAJE':
      return { odometroActual: form.odometroActual }
    case 'COMBUSTIBLE':
      return {
        tipoCombustible:  form.tipoCombustible,
        litros:           form.litros,
        monto:            form.monto,
        odometroAlCargar: form.odometroAlCargar || undefined,
        estacion:         form.estacion || undefined,
      }
    case 'PEAJE':
      return {
        monto:     form.monto || 0,
        esTag:     !!form.esTag,
        autopista: form.autopista || undefined,
        sentido:   form.sentido   || 'IDA',
      }
    case 'MANTENCION':
      return {
        tipoMantencion: form.tipoMantencion,
        taller:         form.taller      || undefined,
        costo:          form.costo       || undefined,
        odometro:       form.odometro    || undefined,
        numeroFolio:    form.numeroFolio || undefined,
        proxFecha:      form.proxFecha   || undefined,
        proxKm:         form.proxKm      || undefined,
      }
    case 'CAMBIO_ESTADO':
      return {
        estadoNuevo:          form.estadoNuevo,
        motivo:               form.motivo               || undefined,
        tallerNombre:         form.tallerNombre         || undefined,
        fechaRetornoEstimada: form.fechaRetornoEstimada || undefined,
      }
    default:
      return {}
  }
}
