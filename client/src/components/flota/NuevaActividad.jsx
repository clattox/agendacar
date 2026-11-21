// components/flota/NuevaActividad.jsx
import { useState } from 'react'
import { useRegistrarActividad } from '../../hooks/useFlota'

const TIPOS = [
  { id: 'KILOMETRAJE',   label: 'Kilometraje',   desc: 'Lectura de odómetro'      },
  { id: 'COMBUSTIBLE',   label: 'Combustible',   desc: 'Litros, monto, estación'  },
  { id: 'PEAJE',         label: 'Peaje',          desc: 'Autopista, sentido, monto' },
  { id: 'MANTENCION',    label: 'Mantención',    desc: 'Tipo, taller, costo'      },
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
  const [tipo,          setTipo]          = useState('KILOMETRAJE')
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

    if (tipo === 'KILOMETRAJE'   && !form.odometroActual)                       return setValidationErr('Ingresa el odómetro actual')
    if (tipo === 'COMBUSTIBLE'   && (!form.tipoCombustible || !form.litros || !form.monto)) return setValidationErr('Completa tipo, litros y monto')
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
          <div className="w-14 h-14 rounded-full bg-green-400/10 border-2 border-green-400 flex items-center justify-center">
            <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white">Registro guardado</h3>
          <p className="text-sm text-zinc-400">
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
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#363636]">
        <div>
          <h2 className="font-bold text-white text-base">Nueva actividad</h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-mono">{vehiculo.marca} · {vehiculo.patente}</p>
        </div>
        <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto max-h-[70vh]">
        {/* Selector de tipo */}
        <div className="p-5 border-b border-[#363636]">
          <div className="grid grid-cols-5 gap-2">
            {TIPOS.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => { setTipo(t.id); setForm({}) }}
                className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-center transition-all
                  ${tipo === t.id
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                    : 'border-[#363636] bg-[#2b2b2b] text-zinc-400 hover:border-zinc-500'}`}
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
          {tipo === 'KILOMETRAJE'   && <FormKm    form={form} set={set} odometroActual={vehiculo.odometroActual ?? 0} />}
          {tipo === 'COMBUSTIBLE'   && <FormComb  form={form} set={set} />}
          {tipo === 'PEAJE'         && <FormPeaje form={form} set={set} />}
          {tipo === 'MANTENCION'    && <FormMant  form={form} set={set} />}
          {tipo === 'CAMBIO_ESTADO' && <FormEstado form={form} set={set} />}

          <Field label="Notas (opcional)">
            <textarea rows={2} onChange={e => set('notas', e.target.value)}
              className="input resize-none" placeholder="Observaciones…" />
          </Field>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#363636] flex items-center justify-between gap-3">
          <div className="text-xs text-red-400">{validationErr || (error && `Error: ${error}`)}</div>
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
          className="input bg-amber-500/10 text-amber-400 border-transparent cursor-default" />
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
                  ? 'border-green-400/40 bg-green-400/10 text-green-400'
                  : 'border-[#363636] bg-[#2b2b2b] text-zinc-400 hover:border-zinc-500'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Litros *">
          <div className="relative">
            <input type="number" className="input pr-7" placeholder="42"
              onChange={e => set('litros', Number(e.target.value))} />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500">L</span>
          </div>
        </Field>
        <Field label="Monto total *">
          <div className="relative">
            <input type="number" className="input pr-5" placeholder="74000"
              onChange={e => set('monto', Number(e.target.value))} />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500">$</span>
          </div>
        </Field>
        <Field label="Precio/L" hint="calculado">
          <input readOnly value={precioLitro ? `$${precioLitro.toLocaleString('es-CL')}/L` : '—'}
            className="input bg-amber-500/10 text-amber-400 border-transparent cursor-default" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Estación de servicio">
          <input type="text" className="input" placeholder="Copec, Petrobras…"
            onChange={e => set('estacion', e.target.value)} />
        </Field>
        <Field label="Odómetro al cargar">
          <div className="relative">
            <input type="number" className="input pr-8" placeholder="87420"
              onChange={e => set('odometroAlCargar', Number(e.target.value))} />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500">km</span>
          </div>
        </Field>
      </div>
    </>
  )
}

function FormPeaje({ form, set }) {
  const esTag = !!form.esTag
  return (
    <>
      {/* Toggle Tag */}
      <button
        type="button"
        onClick={() => { set('esTag', !esTag); if (!esTag) set('monto', '') }}
        className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border transition-all text-left
          ${esTag
            ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
            : 'border-[#363636] bg-[#2b2b2b] text-zinc-400 hover:border-zinc-500'}`}
      >
        {/* Icono tag (chip/transponder) */}
        <svg className={`w-5 h-5 flex-shrink-0 ${esTag ? 'text-blue-400' : 'text-zinc-500'}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
          <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
        </svg>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold">Pagado con Tag electrónico</div>
          <div className={`text-xs mt-0.5 ${esTag ? 'text-blue-400/70' : 'text-zinc-600'}`}>
            {esTag
              ? 'El administrador cargará el monto desde el estado de cuenta'
              : 'Activar si el peaje fue cobrado por telepeaje / Tag'}
          </div>
        </div>
        <div className={`w-9 h-5 rounded-full flex-shrink-0 relative transition-colors ${esTag ? 'bg-blue-500' : 'bg-zinc-700'}`}>
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
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500">$</span>
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
                  ? 'border-zinc-400/40 bg-zinc-400/10 text-zinc-200'
                  : 'border-[#363636] bg-[#2b2b2b] text-zinc-400 hover:border-zinc-500'}`}>
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
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500">$</span>
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
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500">km</span>
          </div>
        </Field>
        <Field label="Próxima fecha">
          <input type="date" className="input" onChange={e => set('proxFecha', e.target.value)} />
        </Field>
        <Field label="Próximo km">
          <div className="relative">
            <input type="number" className="input pr-8" placeholder="92420"
              onChange={e => set('proxKm', Number(e.target.value))} />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500">km</span>
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
            ['OPERATIVO',         'Operativo',         'text-green-400 bg-green-400/10 border-green-400/40'],
            ['EN_TALLER',         'En taller',          'text-amber-400 bg-amber-400/10 border-amber-400/40'],
            ['FUERA_DE_SERVICIO', 'Fuera de servicio',  'text-red-400   bg-red-400/10   border-red-400/40'  ],
          ].map(([v, l, cls]) => (
            <button key={v} type="button" onClick={() => set('estadoNuevo', v)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all
                ${form.estadoNuevo === v ? cls : 'border-[#363636] bg-[#2b2b2b] text-zinc-400 hover:border-zinc-500'}`}>
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
        className="bg-[#222] border border-[#363636] rounded-2xl w-full max-w-xl shadow-2xl"
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
      <label className="flex items-center text-xs font-semibold text-zinc-400">
        {label}
        {hint && <span className="ml-auto font-normal text-zinc-600">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

// ——— Helper: construir payload de detalle por tipo —————————————

function buildDetalle(tipo, form) {
  switch (tipo) {
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
