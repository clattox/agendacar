import { useEffect, useRef, useState } from 'react'
import { Car, ChevronDown, ChevronUp, ClipboardList, History, ListChecks, Pencil, Plus, Save, Search, Trash2, X } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { Alert, Button, Dialog, FormField, Input } from '../../components/ui'
import {
  crearVehiculo, listarVehiculos, actualizarVehiculo,
  obtenerHistorialVehiculo,
  listarCatalogo, agregarCatalogo, eliminarCatalogo
} from '../../services/vehiculosService'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { getUsuario } from '../../lib/auth'
import { formatFullDate, formatTimeFromISO } from '../../lib/dates'

const FORM_VACIO = { patente: '', marca: '', modelo: '', anio: '', kilometraje: '' }

// ── Tab Vehículos ────────────────────────────────────────────────────────────

function TabVehiculos() {
  const [lista, setLista]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [busqueda, setBusqueda]   = useState('')

  const [modalNuevo, setModalNuevo]   = useState(false)
  const [formNuevo, setFormNuevo]     = useState(FORM_VACIO)
  const [creando, setCreando]         = useState(false)
  const [errorNuevo, setErrorNuevo]   = useState('')

  const [editando, setEditando]   = useState(null)
  const [form, setForm]           = useState({})
  const [guardando, setGuardando] = useState(false)
  const [errorEdit, setErrorEdit] = useState('')
  const [historialVehiculo, setHistorialVehiculo] = useState(null)
  const [cargandoHistorial, setCargandoHistorial] = useState(false)
  const marcaRef = useRef(null)

  const cargar = async () => {
    setLoading(true)
    setError('')
    try {
      setLista(await listarVehiculos())
    } catch {
      setError('No se pudieron cargar los vehículos.')
    } finally {
      setLoading(false)
    }
  }

  const abrirHistorial = async (v) => {
    setHistorialVehiculo({ vehiculo: v, reservas: null })
    setCargandoHistorial(true)
    try {
      const data = await obtenerHistorialVehiculo(v.patente)
      setHistorialVehiculo({ vehiculo: v, reservas: data.reservas || [] })
    } catch {
      setHistorialVehiculo({ vehiculo: v, reservas: [] })
    } finally {
      setCargandoHistorial(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const iniciarEdicion = (v) => {
    setEditando(v.patente)
    setForm({
      marca:       v.marca       ?? '',
      modelo:      v.modelo      ?? '',
      anio:        v.anio        ?? '',
      kilometraje: v.kilometraje ?? ''
    })
    setErrorEdit('')
    setTimeout(() => marcaRef.current?.focus(), 0)
  }

  const cancelarEdicion = () => {
    setEditando(null)
    setForm({})
    setErrorEdit('')
  }

  const guardar = async (patente) => {
    setGuardando(true)
    setErrorEdit('')
    try {
      const payload = {
        marca:       form.marca.trim()       || null,
        modelo:      form.modelo.trim()      || null,
        anio:        form.anio        !== '' ? Number(form.anio)        : null,
        kilometraje: form.kilometraje !== '' ? Number(form.kilometraje) : null
      }
      const actualizado = await actualizarVehiculo(patente, payload)
      setLista(prev => prev.map(v =>
        v.patente === patente ? { ...v, ...actualizado } : v
      ))
      setEditando(null)
    } catch {
      setErrorEdit('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  const abrirNuevo = () => {
    setFormNuevo(FORM_VACIO)
    setErrorNuevo('')
    setModalNuevo(true)
  }

  const crearNuevo = async () => {
    if (!formNuevo.patente.trim()) {
      setErrorNuevo('La patente es obligatoria.')
      return
    }
    setCreando(true)
    setErrorNuevo('')
    try {
      const nuevo = await crearVehiculo({
        patente:     formNuevo.patente.trim(),
        marca:       formNuevo.marca.trim()       || null,
        modelo:      formNuevo.modelo.trim()      || null,
        anio:        formNuevo.anio        !== '' ? Number(formNuevo.anio)        : null,
        kilometraje: formNuevo.kilometraje !== '' ? Number(formNuevo.kilometraje) : null
      })
      setLista(prev => [{ ...nuevo, _count: { reservas: 0 } }, ...prev])
      setModalNuevo(false)
    } catch (err) {
      setErrorNuevo(err.response?.data?.error || 'No se pudo crear el vehículo.')
    } finally {
      setCreando(false)
    }
  }

  const listaFiltrada = lista.filter(v => {
    if (!busqueda.trim()) return true
    const q = busqueda.toLowerCase()
    return (
      v.patente.toLowerCase().includes(q) ||
      (v.marca  ?? '').toLowerCase().includes(q) ||
      (v.modelo ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <Input
            placeholder="Buscar por patente, marca o modelo…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="primary" leftIcon={Plus} onClick={abrirNuevo}>
          Nuevo vehículo
        </Button>
      </div>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-graphite-50" />
          ))}
        </div>
      ) : listaFiltrada.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Car className="h-10 w-10 text-ink-soft" />
          <p className="text-sm text-ink-muted">
            {busqueda ? 'Sin resultados para esa búsqueda.' : 'No hay vehículos registrados todavía.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-graphite-50">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-ink-soft">Patente</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-ink-soft">Marca</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-ink-soft">Modelo</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-ink-soft">Año</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-ink-soft">Km</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-ink-soft">Atenciones</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {listaFiltrada.map(v => {
                const enEdicion = editando === v.patente
                return (
                  <tr key={v.patente} className={enEdicion ? 'bg-accent-50' : 'hover:bg-graphite-50'}>
                    <td className="px-4 py-3 font-mono font-semibold uppercase text-ink">
                      {v.patente}
                    </td>

                    {enEdicion ? (
                      <>
                        <td className="px-2 py-2">
                          <input
                            ref={marcaRef}
                            type="text"
                            value={form.marca}
                            onChange={e => setForm(f => ({ ...f, marca: e.target.value }))}
                            placeholder="Marca"
                            className="w-full rounded border border-line bg-white px-2 py-1.5 text-sm text-ink placeholder:text-ink-soft focus:border-accent-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={form.modelo}
                            onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))}
                            placeholder="Modelo"
                            className="w-full rounded border border-line bg-white px-2 py-1.5 text-sm text-ink placeholder:text-ink-soft focus:border-accent-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={form.anio}
                            onChange={e => setForm(f => ({ ...f, anio: e.target.value }))}
                            placeholder="Año"
                            min="1900" max="2099"
                            className="w-20 rounded border border-line bg-white px-2 py-1.5 text-sm text-ink placeholder:text-ink-soft focus:border-accent-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={form.kilometraje}
                            onChange={e => setForm(f => ({ ...f, kilometraje: e.target.value }))}
                            placeholder="km"
                            min="0"
                            className="w-24 rounded border border-line bg-white px-2 py-1.5 text-sm text-ink placeholder:text-ink-soft focus:border-accent-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-3 text-ink-muted">
                          {v._count?.reservas ?? 0}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="primary"
                              leftIcon={Save}
                              loading={guardando}
                              onClick={() => guardar(v.patente)}
                            >
                              Guardar
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              leftIcon={X}
                              disabled={guardando}
                              onClick={cancelarEdicion}
                            >
                              Cancelar
                            </Button>
                          </div>
                          {errorEdit && (
                            <p className="mt-1 text-xs text-red-500">{errorEdit}</p>
                          )}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-ink">
                          {v.marca || <span className="text-ink-soft">—</span>}
                        </td>
                        <td className="px-4 py-3 text-ink">
                          {v.modelo || <span className="text-ink-soft">—</span>}
                        </td>
                        <td className="px-4 py-3 text-ink">
                          {v.anio || <span className="text-ink-soft">—</span>}
                        </td>
                        <td className="px-4 py-3 text-ink">
                          {v.kilometraje != null
                            ? `${Number(v.kilometraje).toLocaleString('es-CL')} km`
                            : <span className="text-ink-soft">—</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-ink-muted">
                          {v._count?.reservas ?? 0}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {(v._count?.reservas ?? 0) > 0 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                leftIcon={History}
                                onClick={() => abrirHistorial(v)}
                              >
                                Historial
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="secondary"
                              leftIcon={Pencil}
                              onClick={() => iniciarEdicion(v)}
                            >
                              Editar
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal nuevo vehículo ── */}
      <Dialog
        open={modalNuevo}
        onClose={() => { if (!creando) setModalNuevo(false) }}
        title="Nuevo vehículo"
        description="Ingresa los datos del vehículo. Solo la patente es obligatoria."
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setModalNuevo(false)} disabled={creando}>
              Cancelar
            </Button>
            <Button variant="primary" leftIcon={Save} onClick={crearNuevo} loading={creando}>
              Guardar
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {errorNuevo && <Alert variant="error">{errorNuevo}</Alert>}

          <FormField label="Patente" required>
            <Input
              value={formNuevo.patente}
              onChange={e => setFormNuevo(f => ({ ...f, patente: e.target.value.toUpperCase() }))}
              placeholder="Ej: HJYPP44"
              className="font-mono uppercase"
              autoFocus
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Marca">
              <Input
                value={formNuevo.marca}
                onChange={e => setFormNuevo(f => ({ ...f, marca: e.target.value }))}
                placeholder="Ej: Toyota"
              />
            </FormField>
            <FormField label="Modelo">
              <Input
                value={formNuevo.modelo}
                onChange={e => setFormNuevo(f => ({ ...f, modelo: e.target.value }))}
                placeholder="Ej: Hilux"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Año">
              <Input
                type="number"
                value={formNuevo.anio}
                onChange={e => setFormNuevo(f => ({ ...f, anio: e.target.value }))}
                placeholder="Ej: 2020"
                min="1900" max="2099"
              />
            </FormField>
            <FormField label="Kilometraje">
              <Input
                type="number"
                value={formNuevo.kilometraje}
                onChange={e => setFormNuevo(f => ({ ...f, kilometraje: e.target.value }))}
                placeholder="Ej: 45000"
                min="0"
              />
            </FormField>
          </div>
        </div>
      </Dialog>

      {/* Modal historial */}
      {historialVehiculo && (
        <Dialog
          open={Boolean(historialVehiculo)}
          onClose={() => setHistorialVehiculo(null)}
          title={`Historial — ${historialVehiculo.vehiculo.patente}`}
          size="lg"
        >
          <div className="space-y-2">
            <p className="text-sm text-ink-muted mb-4">
              {[historialVehiculo.vehiculo.marca, historialVehiculo.vehiculo.modelo, historialVehiculo.vehiculo.anio]
                .filter(Boolean).join(' ')}
            </p>

            {cargandoHistorial ? (
              <p className="text-sm text-ink-muted py-6 text-center">Cargando historial...</p>
            ) : !historialVehiculo.reservas?.length ? (
              <p className="text-sm text-ink-muted py-6 text-center">Sin atenciones registradas.</p>
            ) : (
              <div className="space-y-3">
                {historialVehiculo.reservas.map(r => (
                  <FilaHistorial key={r.id} reserva={r} />
                ))}
              </div>
            )}
          </div>
        </Dialog>
      )}
    </>
  )
}

// ── Fila de historial (acordeón) ─────────────────────────────────────────────

const formatCLP = v =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v || 0)

function FilaHistorial({ reserva }) {
  const [abierto, setAbierto] = useState(false)
  const tieneCierre = Boolean(reserva.cierre)
  const total = reserva.cierre?.items?.reduce((s, i) => s + (i.valor || 0), 0) ?? 0

  const estadoColor = {
    pendiente:  'text-yellow-600 bg-yellow-50 border-yellow-200',
    confirmada: 'text-blue-600 bg-blue-50 border-blue-200',
    atendida:   'text-green-600 bg-green-50 border-green-200',
    cancelada:  'text-red-500 bg-red-50 border-red-200',
  }[reserva.estado] || 'text-ink-muted bg-surface border-line'

  return (
    <div className="rounded-xl border border-line bg-surface overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-raised transition-colors"
        onClick={() => setAbierto(a => !a)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-ink">
              {formatFullDate(new Date(reserva.fecha))} · {formatTimeFromISO(reserva.fecha)}
            </span>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${estadoColor}`}>
              {reserva.estado}
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">{reserva.servicio?.nombre || '—'} · {reserva.nombre}</p>
        </div>
        {tieneCierre && (
          <span className="text-xs font-semibold text-green-600 shrink-0">{formatCLP(total)}</span>
        )}
        {abierto ? <ChevronUp size={16} className="text-ink-muted shrink-0" /> : <ChevronDown size={16} className="text-ink-muted shrink-0" />}
      </button>

      {abierto && (
        <div className="border-t border-line px-4 py-3 bg-surface-raised space-y-3 text-sm">
          {tieneCierre ? (
            <>
              {reserva.cierre.items?.length > 0 && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-ink-muted uppercase">
                      <th className="text-left pb-1">Trabajo realizado</th>
                      <th className="text-right pb-1">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reserva.cierre.items.map((item, i) => (
                      <tr key={i} className="border-t border-line">
                        <td className="py-1.5 text-ink">{item.descripcion}</td>
                        <td className="py-1.5 text-right text-ink font-medium">{formatCLP(item.valor)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-line font-semibold">
                      <td className="pt-2 text-ink">Total</td>
                      <td className="pt-2 text-right text-green-600">{formatCLP(total)}</td>
                    </tr>
                  </tbody>
                </table>
              )}
              {reserva.cierre.notas && (
                <p className="text-xs text-ink-muted border-l-2 border-line pl-3">{reserva.cierre.notas}</p>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-ink-muted">
              <ClipboardList size={14} />
              <span className="text-xs">Sin cierre registrado</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Tab Catálogo ─────────────────────────────────────────────────────────────

function TabCatalogo() {
  const tenantId = getUsuario()?.tenantId

  const capitalizar = s => s.replace(/\b\w/g, c => c.toUpperCase())

  const [entradas, setEntradas]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  // Modal agregar
  const [modal, setModal]         = useState(false)
  const [formMarca, setFormMarca] = useState('')
  const [formModelo, setFormModelo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorModal, setErrorModal] = useState('')

  // Eliminando
  const [eliminandoId, setEliminandoId] = useState(null)

  const cargar = async () => {
    if (!tenantId) return
    setLoading(true)
    setError('')
    try {
      setEntradas(await listarCatalogo(tenantId))
    } catch {
      setError('No se pudo cargar el catálogo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const abrirModal = () => {
    setFormMarca('')
    setFormModelo('')
    setErrorModal('')
    setModal(true)
  }

  const guardar = async () => {
    if (!formMarca.trim()) {
      setErrorModal('La marca es obligatoria.')
      return
    }
    setGuardando(true)
    setErrorModal('')
    try {
      const nueva = await agregarCatalogo({ marca: formMarca.trim(), modelo: formModelo.trim() })
      setEntradas(prev => [...prev, nueva].sort((a, b) =>
        a.marca.localeCompare(b.marca, 'es') || a.modelo.localeCompare(b.modelo, 'es')
      ))
      setModal(false)
    } catch (err) {
      setErrorModal(err.response?.data?.error || 'Ya existe esa entrada o hubo un error.')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (id) => {
    setEliminandoId(id)
    try {
      await eliminarCatalogo(id)
      setEntradas(prev => prev.filter(e => e.id !== id))
    } catch {
      setError('No se pudo eliminar la entrada.')
    } finally {
      setEliminandoId(null)
    }
  }

  // Agrupar por marca para mostrar ordenado
  const porMarca = entradas.reduce((acc, e) => {
    if (!acc[e.marca]) acc[e.marca] = []
    acc[e.marca].push(e)
    return acc
  }, {})
  const marcas = Object.keys(porMarca).sort((a, b) => a.localeCompare(b, 'es'))

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          Agrega marcas y modelos que no aparecen en el formulario público de reservas.
          Los cambios se aplican de inmediato al formulario.
        </p>
        <Button variant="primary" leftIcon={Plus} onClick={abrirModal} className="shrink-0">
          Agregar
        </Button>
      </div>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-graphite-50" />
          ))}
        </div>
      ) : marcas.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line py-16 text-center">
          <ListChecks className="h-10 w-10 text-ink-soft" />
          <div>
            <p className="text-sm font-medium text-ink">Sin entradas personalizadas</p>
            <p className="mt-1 text-xs text-ink-muted">
              Las marcas y modelos predeterminados ya están disponibles.<br />
              Agrega aquí solo los que no aparecen en la lista.
            </p>
          </div>
          <Button variant="secondary" leftIcon={Plus} size="sm" onClick={abrirModal}>
            Agregar primera entrada
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {marcas.map(marca => (
            <div key={marca} className="overflow-hidden rounded-xl border border-line">
              <div className="border-b border-line bg-graphite-50 px-4 py-2.5">
                <span className="text-sm font-semibold text-ink">{marca}</span>
              </div>
              <div className="divide-y divide-line">
                {porMarca[marca].map(e => (
                  <div key={e.id} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm text-ink">
                      {e.modelo || <span className="italic text-ink-soft">(sin modelo)</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => eliminar(e.id)}
                      disabled={eliminandoId === e.id}
                      className="ml-4 flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ink-muted transition-colors hover:bg-danger-50 hover:text-danger-600 disabled:opacity-40"
                      aria-label={`Eliminar ${marca} ${e.modelo}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal agregar ── */}
      <Dialog
        open={modal}
        onClose={() => { if (!guardando) setModal(false) }}
        title="Agregar marca o modelo"
        description="Ingresa la marca y, opcionalmente, el modelo. Aparecerán en el formulario público de reservas."
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setModal(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button variant="primary" leftIcon={Save} onClick={guardar} loading={guardando}>
              Agregar
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {errorModal && <Alert variant="error">{errorModal}</Alert>}

          <FormField label="Marca" required>
            <Input
              value={formMarca}
              onChange={e => setFormMarca(capitalizar(e.target.value))}
              placeholder="Ej: Tesla, Chery, BYD…"
              autoFocus
            />
          </FormField>

          <FormField
            label="Modelo"
            hint="Déjalo vacío si solo quieres agregar la marca (el cliente podrá escribir el modelo manualmente)."
          >
            <Input
              value={formModelo}
              onChange={e => setFormModelo(capitalizar(e.target.value))}
              placeholder="Ej: Model 3, Tiggo 8, Atto 3…"
            />
          </FormField>
        </div>
      </Dialog>
    </>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────

export default function Vehiculos() {
  useDocumentTitle('Vehículos')
  const [tab, setTab] = useState('vehiculos')

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Encabezado */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ink">Vehículos</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Gestiona los vehículos registrados y el catálogo de marcas del formulario de reservas.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg border border-line bg-graphite-50 p-1">
          {[
            { id: 'vehiculos', label: 'Vehículos', icon: Car },
            { id: 'catalogo', label: 'Catálogo de marcas', icon: ListChecks }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                tab === id
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === 'vehiculos' ? <TabVehiculos /> : <TabCatalogo />}
      </div>
    </AdminLayout>
  )
}
