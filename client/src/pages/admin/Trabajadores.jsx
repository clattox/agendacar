import { useEffect, useState } from 'react'
import {
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  UserCheck,
  Users,
  X
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { Alert, Button, Input } from '../../components/ui'
import {
  listarTrabajadores,
  crearTrabajador,
  actualizarTrabajador,
  eliminarTrabajador
} from '../../services/trabajadorService'
import useDocumentTitle from '../../hooks/useDocumentTitle'

const FORM_VACIO = { nombre: '', cargo: '' }

export default function Trabajadores() {
  useDocumentTitle('Trabajadores')

  const [lista, setLista]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [exito, setExito]           = useState('')
  const [guardando, setGuardando]   = useState(false)

  // Modal crear / editar
  const [modal, setModal]           = useState(false)
  const [editando, setEditando]     = useState(null)  // null = nuevo, objeto = editar
  const [form, setForm]             = useState(FORM_VACIO)
  const [formError, setFormError]   = useState('')

  // Confirmación borrar
  const [confirmId, setConfirmId]   = useState(null)

  const cargar = async () => {
    try {
      setLista(await listarTrabajadores())
    } catch {
      setError('No se pudieron cargar los trabajadores.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const abrirNuevo = () => {
    setEditando(null)
    setForm(FORM_VACIO)
    setFormError('')
    setModal(true)
  }

  const abrirEditar = (t) => {
    setEditando(t)
    setForm({ nombre: t.nombre, cargo: t.cargo || '' })
    setFormError('')
    setModal(true)
  }

  const cerrarModal = () => {
    setModal(false)
    setEditando(null)
    setFormError('')
  }

  const handleGuardar = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) { setFormError('El nombre es obligatorio.'); return }
    setGuardando(true)
    setFormError('')
    try {
      if (editando) {
        const actualizado = await actualizarTrabajador(editando.id, {
          nombre: form.nombre,
          cargo: form.cargo
        })
        setLista(prev => prev.map(t => t.id === actualizado.id ? actualizado : t))
        setExito('Trabajador actualizado.')
      } else {
        const nuevo = await crearTrabajador({ nombre: form.nombre, cargo: form.cargo })
        setLista(prev => [nuevo, ...prev])
        setExito('Trabajador creado.')
      }
      cerrarModal()
      setTimeout(() => setExito(''), 3000)
    } catch (err) {
      setFormError(err.message || 'Error al guardar.')
    } finally {
      setGuardando(false)
    }
  }

  const toggleActivo = async (t) => {
    try {
      const actualizado = await actualizarTrabajador(t.id, { activo: !t.activo })
      setLista(prev => prev.map(x => x.id === actualizado.id ? actualizado : x))
    } catch {
      setError('Error al cambiar estado.')
    }
  }

  const handleEliminar = async (id) => {
    try {
      const res = await eliminarTrabajador(id)
      if (res._desactivado) {
        // Tenía inspecciones → fue desactivado
        setLista(prev => prev.map(t => t.id === id ? { ...t, activo: false } : t))
        setExito('El trabajador tiene inspecciones asignadas y fue desactivado.')
      } else {
        setLista(prev => prev.filter(t => t.id !== id))
        setExito('Trabajador eliminado.')
      }
      setConfirmId(null)
      setTimeout(() => setExito(''), 4000)
    } catch (err) {
      setError(err.message || 'Error al eliminar.')
      setConfirmId(null)
    }
  }

  const activos   = lista.filter(t => t.activo)
  const inactivos = lista.filter(t => !t.activo)

  return (
    <AdminLayout>
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">

        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-ink flex items-center gap-2">
              <Users className="h-5 w-5 text-accent-600" aria-hidden="true" />
              Trabajadores
            </h1>
            <p className="text-sm text-ink-muted mt-0.5">
              Mecánicos y personal que realiza las inspecciones.
            </p>
          </div>
          <Button onClick={abrirNuevo} className="bg-accent-600 hover:bg-accent-700 text-white shrink-0">
            <Plus className="h-4 w-4 mr-1.5" />
            Agregar
          </Button>
        </div>

        {error && <Alert variant="error" onDismiss={() => setError('')}>{error}</Alert>}
        {exito && <Alert variant="success">{exito}</Alert>}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
          </div>
        ) : lista.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-surface p-10 text-center space-y-2">
            <Users className="h-8 w-8 text-ink-soft mx-auto" />
            <p className="text-sm text-ink-muted">Aún no hay trabajadores registrados.</p>
            <Button variant="outline" size="sm" onClick={abrirNuevo}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Agregar primer trabajador
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Activos */}
            {activos.length > 0 && (
              <div className="rounded-xl border border-line bg-surface overflow-hidden">
                <div className="px-4 py-2.5 border-b border-line bg-surface-raised">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Activos ({activos.length})
                  </h2>
                </div>
                <ul className="divide-y divide-line">
                  {activos.map(t => (
                    <TrabajadorFila
                      key={t.id}
                      trabajador={t}
                      confirmId={confirmId}
                      onEditar={() => abrirEditar(t)}
                      onToggleActivo={() => toggleActivo(t)}
                      onConfirmarEliminar={() => setConfirmId(t.id)}
                      onCancelarEliminar={() => setConfirmId(null)}
                      onEliminar={() => handleEliminar(t.id)}
                    />
                  ))}
                </ul>
              </div>
            )}

            {/* Inactivos */}
            {inactivos.length > 0 && (
              <div className="rounded-xl border border-line bg-surface overflow-hidden opacity-75">
                <div className="px-4 py-2.5 border-b border-line bg-surface-raised">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Inactivos ({inactivos.length})
                  </h2>
                </div>
                <ul className="divide-y divide-line">
                  {inactivos.map(t => (
                    <TrabajadorFila
                      key={t.id}
                      trabajador={t}
                      confirmId={confirmId}
                      onEditar={() => abrirEditar(t)}
                      onToggleActivo={() => toggleActivo(t)}
                      onConfirmarEliminar={() => setConfirmId(t.id)}
                      onCancelarEliminar={() => setConfirmId(null)}
                      onEliminar={() => handleEliminar(t.id)}
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal crear / editar */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={e => { if (e.target === e.currentTarget) cerrarModal() }}>
          <div className="w-full max-w-sm bg-surface rounded-2xl shadow-xl border border-line">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <h2 className="font-semibold text-ink">
                {editando ? 'Editar trabajador' : 'Nuevo trabajador'}
              </h2>
              <button onClick={cerrarModal} className="text-ink-muted hover:text-ink transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleGuardar} className="p-5 space-y-4">
              {formError && <Alert variant="error">{formError}</Alert>}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-ink">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <Input
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej: Juan Pérez"
                  maxLength={80}
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-ink">Cargo</label>
                <Input
                  value={form.cargo}
                  onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
                  placeholder="Ej: Mecánico, Recepcionista"
                  maxLength={60}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" onClick={cerrarModal} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" disabled={guardando} className="flex-1 bg-accent-600 hover:bg-accent-700 text-white">
                  {guardando
                    ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Guardando…</>
                    : <><Save className="h-4 w-4 mr-1.5" />{editando ? 'Guardar cambios' : 'Crear trabajador'}</>
                  }
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

function TrabajadorFila({ trabajador: t, confirmId, onEditar, onToggleActivo, onConfirmarEliminar, onCancelarEliminar, onEliminar }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-700">
        <UserCheck className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink truncate">{t.nombre}</p>
        {t.cargo && <p className="text-xs text-ink-muted truncate">{t.cargo}</p>}
      </div>
      {confirmId === t.id ? (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-red-600 font-medium">¿Eliminar?</span>
          <button
            onClick={onEliminar}
            className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 font-medium"
          >
            Sí
          </button>
          <button
            onClick={onCancelarEliminar}
            className="text-xs px-2 py-1 rounded border border-line text-ink-muted hover:text-ink"
          >
            No
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggleActivo}
            title={t.activo ? 'Desactivar' : 'Activar'}
            className={`text-xs px-2 py-1 rounded-full font-medium border transition-colors ${
              t.activo
                ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                : 'bg-surface border-line text-ink-muted hover:border-gray-300'
            }`}
          >
            {t.activo ? 'Activo' : 'Inactivo'}
          </button>
          <button
            onClick={onEditar}
            title="Editar"
            className="p-1.5 text-ink-muted hover:text-ink rounded-lg hover:bg-surface-raised transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={onConfirmarEliminar}
            title="Eliminar"
            className="p-1.5 text-ink-muted hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </li>
  )
}
