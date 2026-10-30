import { useEffect, useRef, useState } from 'react'
import {
  Car, ChevronDown, ChevronUp, Clock, Edit2,
  Mail, Phone, Search, UserRound, Users, X, Check, Loader2
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { listarClientes, actualizarCliente } from '../../services/clientesService'

// ── Utilidades ────────────────────────────────────────────────────────────────

const formatFecha = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC'
  })
}

const ESTADO_BADGE = {
  confirmada:    'bg-blue-50 text-blue-600 border border-blue-200',
  inspeccionada: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  atendida:      'bg-green-50 text-green-700 border border-green-200',
  cancelada:     'bg-red-50 text-red-600 border border-red-200',
}

// ── Tarjeta de cliente ────────────────────────────────────────────────────────

function TarjetaCliente({ cliente, onActualizado }) {
  const [expandido, setExpandido] = useState(false)
  const [editando, setEditando]   = useState(false)
  const [nombre, setNombre]       = useState(cliente.nombre)
  const [email, setEmail]         = useState(cliente.email || '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError]         = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (editando) setTimeout(() => inputRef.current?.focus(), 60)
  }, [editando])

  const handleGuardar = async () => {
    if (!nombre.trim()) return
    setGuardando(true); setError('')
    try {
      await actualizarCliente(cliente.telefono, { nombre: nombre.trim(), email: email.trim() || null })
      onActualizado()
      setEditando(false)
    } catch {
      setError('No se pudo guardar.')
    } finally {
      setGuardando(false)
    }
  }

  const handleCancelar = () => {
    setNombre(cliente.nombre)
    setEmail(cliente.email || '')
    setError('')
    setEditando(false)
  }

  return (
    <li className="divide-y divide-line">
      {/* Fila principal */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Avatar */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-600 font-bold text-sm select-none">
          {cliente.nombre?.[0]?.toUpperCase() || '?'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {editando ? (
            <div className="space-y-1.5">
              <input
                ref={inputRef}
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Nombre del cliente"
                className="w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent-400"
              />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email (opcional)"
                className="w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent-400"
              />
              {error && <p className="text-xs text-danger-600">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleGuardar}
                  disabled={guardando || !nombre.trim()}
                  className="flex items-center gap-1 rounded-lg bg-accent-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-700 disabled:opacity-50 transition-colors"
                >
                  <Check size={12} /> {guardando ? 'Guardando…' : 'Guardar'}
                </button>
                <button
                  onClick={handleCancelar}
                  className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs text-ink-muted hover:text-ink transition-colors"
                >
                  <X size={12} /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-ink text-sm">{cliente.nombre}</span>
                <button
                  onClick={() => setEditando(true)}
                  className="text-ink-soft hover:text-accent-600 transition-colors"
                  title="Editar datos"
                >
                  <Edit2 size={12} />
                </button>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-ink-muted">
                <span className="flex items-center gap-1"><Phone size={10} /> {cliente.telefono}</span>
                {cliente.email && <span className="flex items-center gap-1"><Mail size={10} /> {cliente.email}</span>}
              </div>
              {/* Vehículos */}
              {cliente.vehiculos.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {cliente.vehiculos.map((v, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1 rounded-full border border-line bg-graphite-50 px-2.5 py-0.5 text-[11px] text-ink-muted"
                    >
                      <Car size={10} className="text-ink-soft" />
                      <span className="font-mono font-semibold text-ink">{v.patente}</span>
                      {(v.marca || v.modelo) && <span>{[v.marca, v.modelo].filter(Boolean).join(' ')}</span>}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-6 shrink-0 text-right">
          <div>
            <p className="text-[11px] text-ink-muted">Última visita</p>
            <p className="text-xs font-medium text-ink">{formatFecha(cliente.ultimaVisita)}</p>
          </div>
          <div>
            <p className="text-[11px] text-ink-muted">Visitas</p>
            <p className="text-sm font-bold text-ink">{cliente.totalVisitas}</p>
          </div>
        </div>

        {/* Expand */}
        <button
          onClick={() => setExpandido(v => !v)}
          className="p-1.5 text-ink-soft hover:text-ink transition-colors rounded-md hover:bg-graphite-50"
        >
          {expandido ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* Historial expandible */}
      {expandido && (
        <div className="bg-surface-raised px-4 py-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            Historial de reservas
          </p>
          <ul className="space-y-1.5">
            {cliente.reservas.map(r => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-3 text-ink-muted">
                  <Clock size={11} className="shrink-0" />
                  <span>{formatFecha(r.fecha)}</span>
                  <span className="font-mono font-semibold text-ink">{r.patente}</span>
                  <span className="text-ink">{r.servicio}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ESTADO_BADGE[r.estado] || 'bg-graphite-100 text-ink-muted'}`}>
                  {r.estado}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [query, setQuery]       = useState('')
  const timerRef = useRef(null)

  const cargar = async (q = query) => {
    setCargando(true)
    try {
      const data = await listarClientes(q)
      setClientes(data)
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar('') }, []) // eslint-disable-line

  const handleBusqueda = (val) => {
    setBusqueda(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { setQuery(val); cargar(val) }, 350)
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-ink flex items-center gap-2">
              <UserRound className="h-5 w-5 text-accent-600" aria-hidden="true" />
              Clientes
            </h1>
            <p className="text-sm text-ink-muted mt-0.5">
              {cargando ? 'Cargando…' : `${clientes.length} cliente${clientes.length !== 1 ? 's' : ''} registrado${clientes.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Buscador */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none" />
            <input
              type="text"
              placeholder="Nombre, teléfono, patente…"
              value={busqueda}
              onChange={e => handleBusqueda(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface pl-8 pr-8 py-2 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-accent-400"
            />
            {busqueda && (
              <button onClick={() => handleBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Contenido */}
        {cargando ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
          </div>
        ) : clientes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-surface p-10 text-center space-y-2">
            <Users className="h-8 w-8 text-ink-soft mx-auto" />
            <p className="text-sm text-ink-muted">
              {busqueda ? 'Sin resultados para esa búsqueda' : 'Aún no hay clientes registrados'}
            </p>
            <p className="text-xs text-ink-soft">
              {busqueda ? 'Intenta con otro nombre o patente' : 'Los clientes aparecen automáticamente al hacer su primera reserva'}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-line bg-surface overflow-hidden">
            <div className="px-4 py-2.5 border-b border-line bg-surface-raised">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Clientes ({clientes.length})
              </h2>
            </div>
            <ul className="divide-y divide-line">
              {clientes.map(c => (
                <TarjetaCliente
                  key={c.telefono}
                  cliente={c}
                  onActualizado={() => cargar(query)}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
