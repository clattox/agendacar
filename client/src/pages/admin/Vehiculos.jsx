import { useEffect, useRef, useState } from 'react'
import { Car, Pencil, Save, Search, X } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { Alert, Button, Input } from '../../components/ui'
import { listarVehiculos, actualizarVehiculo } from '../../services/vehiculosService'
import useDocumentTitle from '../../hooks/useDocumentTitle'

export default function Vehiculos() {
  useDocumentTitle('Vehículos')

  const [lista, setLista]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [busqueda, setBusqueda]   = useState('')

  // Fila en edición: { id, patente, marca, modelo, anio, kilometraje }
  const [editando, setEditando]   = useState(null)
  const [form, setForm]           = useState({})
  const [guardando, setGuardando] = useState(false)
  const [errorEdit, setErrorEdit] = useState('')
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
    <AdminLayout>
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Encabezado */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink">Vehículos</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Marca, modelo y datos de los vehículos registrados en el sistema
            </p>
          </div>
        </div>

        {/* Buscador */}
        <div className="mb-4 relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <Input
            placeholder="Buscar por patente, marca o modelo…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Estado */}
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
                            <Button
                              size="sm"
                              variant="secondary"
                              leftIcon={Pencil}
                              onClick={() => iniciarEdicion(v)}
                            >
                              Editar
                            </Button>
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
      </div>
    </AdminLayout>
  )
}
