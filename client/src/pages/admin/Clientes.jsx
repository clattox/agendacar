import { useEffect, useRef, useState } from 'react'
import {
  Car, ChevronDown, ChevronUp, Edit2, Mail, Phone,
  Search, Users, X, Check, Clock
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
  confirmada:   'bg-blue-500/15 text-blue-400',
  inspeccionada:'bg-yellow-500/15 text-yellow-400',
  atendida:     'bg-green-500/15 text-green-400',
  cancelada:    'bg-red-500/15 text-red-400',
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
    <div className="rounded-xl border border-[#2A2D35] bg-[#22252E] overflow-hidden">
      {/* Cabecera */}
      <div className="flex items-start gap-4 p-4">
        {/* Avatar inicial */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6C8EFF]/15 text-[#6C8EFF] font-bold text-sm select-none">
          {cliente.nombre?.[0]?.toUpperCase() || '?'}
        </div>

        {/* Info cliente */}
        <div className="flex-1 min-w-0">
          {editando ? (
            <div className="space-y-2">
              <input
                ref={inputRef}
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Nombre del cliente"
                className="w-full rounded-lg border border-[#2A2D35] bg-[#1C1F26] text-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C8EFF]"
              />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email (opcional)"
                className="w-full rounded-lg border border-[#2A2D35] bg-[#1C1F26] text-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C8EFF]"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleGuardar}
                  disabled={guardando || !nombre.trim()}
                  className="flex items-center gap-1 rounded-lg bg-[#6C8EFF] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#8BA3FF] disabled:opacity-50 transition-colors"
                >
                  <Check size={12} /> {guardando ? 'Guardando…' : 'Guardar'}
                </button>
                <button
                  onClick={handleCancelar}
                  className="flex items-center gap-1 rounded-lg border border-[#2A2D35] px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  <X size={12} /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-white truncate">{cliente.nombre}</p>
                <button
                  onClick={() => setEditando(true)}
                  className="text-gray-500 hover:text-[#6C8EFF] transition-colors"
                  title="Editar datos"
                >
                  <Edit2 size={13} />
                </button>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Phone size={11} /> {cliente.telefono}
                </span>
                {cliente.email && (
                  <span className="flex items-center gap-1">
                    <Mail size={11} /> {cliente.email}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Stats + expand */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-xs text-gray-500">Última visita</span>
            <span className="text-xs text-gray-300">{formatFecha(cliente.ultimaVisita)}</span>
          </div>
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-xs text-gray-500">Visitas</span>
            <span className="text-xs font-bold text-white">{cliente.totalVisitas}</span>
          </div>
          <button
            onClick={() => setExpandido(v => !v)}
            className="text-gray-500 hover:text-white transition-colors p-1"
          >
            {expandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Vehículos */}
      {cliente.vehiculos.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {cliente.vehiculos.map((v, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 rounded-full bg-[#1C1F26] border border-[#2A2D35] px-3 py-1 text-xs text-gray-300"
            >
              <Car size={11} className="text-gray-500" />
              <span className="font-mono font-bold text-white">{v.patente}</span>
              {(v.marca || v.modelo) && (
                <span className="text-gray-500">{[v.marca, v.modelo].filter(Boolean).join(' ')}</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Historial expandible */}
      {expandido && (
        <div className="border-t border-[#2A2D35] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Historial de reservas
          </p>
          <div className="space-y-2">
            {cliente.reservas.map(r => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg bg-[#1C1F26] px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-3">
                  <Clock size={11} className="text-gray-500 shrink-0" />
                  <span className="text-gray-400">{formatFecha(r.fecha)}</span>
                  <span className="font-mono text-gray-500">{r.patente}</span>
                  <span className="text-gray-300">{r.servicio}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ESTADO_BADGE[r.estado] || 'bg-gray-500/15 text-gray-400'}`}>
                  {r.estado}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function Clientes() {
  const [clientes, setClientes]   = useState([])
  const [cargando, setCargando]   = useState(true)
  const [busqueda, setBusqueda]   = useState('')
  const [query, setQuery]         = useState('')
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

  // Debounce búsqueda
  const handleBusqueda = (val) => {
    setBusqueda(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setQuery(val)
      cargar(val)
    }, 350)
  }

  return (
    <AdminLayout>
      <div className="-m-4 sm:-m-6 md:-m-8 min-h-screen bg-[#1C1F26] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white">Clientes</h1>
            <p className="mt-1 text-sm text-gray-400">
              {cargando ? 'Cargando…' : `${clientes.length} cliente${clientes.length !== 1 ? 's' : ''} registrado${clientes.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Buscador */}
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Nombre, teléfono, patente…"
              value={busqueda}
              onChange={e => handleBusqueda(e.target.value)}
              className="w-full rounded-xl border border-[#2A2D35] bg-[#22252E] pl-9 pr-9 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6C8EFF]"
            />
            {busqueda && (
              <button
                onClick={() => handleBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Contenido */}
        {cargando ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-24 rounded-xl bg-[#22252E] animate-pulse" />
            ))}
          </div>
        ) : clientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Users size={40} className="mb-3 opacity-30" />
            <p className="font-medium text-gray-400">
              {busqueda ? 'Sin resultados para esa búsqueda' : 'Aún no hay clientes registrados'}
            </p>
            <p className="text-sm mt-1">
              {busqueda ? 'Intenta con otro nombre o patente' : 'Los clientes aparecen automáticamente al hacer su primera reserva'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {clientes.map(c => (
              <TarjetaCliente
                key={c.telefono}
                cliente={c}
                onActualizado={() => cargar(query)}
              />
            ))}
          </div>
        )}
      </div>
      </div>
    </AdminLayout>
  )
}
