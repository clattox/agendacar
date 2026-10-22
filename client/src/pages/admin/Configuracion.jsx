import { useEffect, useState } from 'react'
import {
  Ban,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  ImageIcon,
  KeyRound,
  Plus,
  Save,
  Store,
  Trash2,
  UtensilsCrossed,
  Wrench
} from 'lucide-react'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { DIAS_SEMANA } from '../../lib/dates'
import { getToken, getUsuario, saveSession } from '../../lib/auth'
import { getApiErrorMessage } from '../../lib/errors'
import {
  actualizarHorarios,
  listarHorarios
} from '../../services/horariosService'
import {
  crearServicio,
  eliminarServicio,
  listarServicios
} from '../../services/serviciosService'
import {
  crearBloqueo,
  eliminarBloqueo,
  listarBloqueos
} from '../../services/bloqueosService'
import { cambiarPassword } from '../../services/authService'
import { actualizarTenant } from '../../services/tenantService'
import AdminLayout from '../../components/admin/AdminLayout'
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  Input,
  Select,
  Skeleton
} from '../../components/ui'

const DURACIONES = [15, 20, 30, 45, 60, 90, 120]

export default function Configuracion() {
  const [servicios, setServicios] = useState([])
  const [horarios, setHorarios] = useState([])
  const [nuevoServicio, setNuevoServicio] = useState({ nombre: '', duracion: 30 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [errorServicio, setErrorServicio] = useState('')
  const [guardandoServicio, setGuardandoServicio] = useState(false)
  const [eliminando, setEliminando] = useState(null)
  const [aEliminar, setAEliminar] = useState(null)
  const [guardandoHorarios, setGuardandoHorarios] = useState(false)
  const [okHorarios, setOkHorarios] = useState(false)
  const [diasExpandidos, setDiasExpandidos] = useState({})
  const [dialogoCopiar, setDialogoCopiar] = useState(null) // index del día origen
  const [diasDestino, setDiasDestino] = useState([])

  // Bloqueos
  const [bloqueos, setBloqueos] = useState([])
  const [nuevoBloqueo, setNuevoBloqueo] = useState({ fecha: '', horaInicio: '', horaFin: '', motivo: '' })
  const [errorBloqueo, setErrorBloqueo] = useState('')
  const [guardandoBloqueo, setGuardandoBloqueo] = useState(false)
  const [eliminandoBloqueo, setEliminandoBloqueo] = useState(null)

  // Cambio de contraseña
  const [formPassword, setFormPassword] = useState({ actual: '', nueva: '', confirmar: '' })
  const [errorPassword, setErrorPassword] = useState('')
  const [okPassword, setOkPassword] = useState(false)
  const [guardandoPassword, setGuardandoPassword] = useState(false)

  const usuario = getUsuario() || {}
  const tenantId = usuario?.tenant?.id

  // Perfil del taller
  const [perfil, setPerfil] = useState({
    nombre: usuario?.tenant?.nombre || '',
    email: usuario?.tenant?.email || '',
    telefono: usuario?.tenant?.telefono || '',
    logoUrl: usuario?.tenant?.logoUrl || ''
  })
  const [logoPreviewError, setLogoPreviewError] = useState(false)
  const [subiendoLogo, setSubiendoLogo] = useState(false)
  const [guardandoPerfil, setGuardandoPerfil] = useState(false)
  const [okPerfil, setOkPerfil] = useState(false)
  const [errorPerfil, setErrorPerfil] = useState('')

  const comprimirImagen = (file) => new Promise((resolve, reject) => {
    const MAX_PX = 400
    const MAX_KB = 150
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        if (width > MAX_PX || height > MAX_PX) {
          if (width > height) { height = Math.round((height * MAX_PX) / width); width = MAX_PX }
          else { width = Math.round((width * MAX_PX) / height); height = MAX_PX }
        }
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        // Intenta con calidad decreciente hasta quedar bajo MAX_KB
        let quality = 0.9
        let dataUrl
        do {
          dataUrl = canvas.toDataURL('image/jpeg', quality)
          quality -= 0.1
        } while (dataUrl.length > MAX_KB * 1024 * 1.37 && quality > 0.2)
        resolve(dataUrl)
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const handleLogoFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrorPerfil('Solo se aceptan imágenes (PNG, JPG, WebP).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorPerfil('La imagen no debe superar 5 MB.')
      return
    }
    setSubiendoLogo(true)
    setErrorPerfil('')
    try {
      const dataUrl = await comprimirImagen(file)
      setPerfil(prev => ({ ...prev, logoUrl: dataUrl }))
      setLogoPreviewError(false)
    } catch {
      setErrorPerfil('No pudimos procesar la imagen. Prueba con otro archivo.')
    } finally {
      setSubiendoLogo(false)
      e.target.value = ''
    }
  }

  useDocumentTitle('Configuración — AgendaCar')

  useEffect(() => {
    let activo = true
    setLoading(true)
    setError('')

    Promise.all([listarServicios(tenantId), listarHorarios(tenantId), listarBloqueos()])
      .then(([serviciosData, horariosData, bloqueosData]) => {
        if (!activo) return
        setServicios(serviciosData)
        const todos = DIAS_SEMANA.map((nombre, index) => {
          const existente = horariosData.find(horario => horario.diaSemana === index)
          return existente || {
            diaSemana: index,
            horaInicio: '09:00',
            horaFin: '18:00',
            activo: false
          }
        })
        setHorarios(todos)
        setBloqueos(bloqueosData)
      })
      .catch(err => {
        if (activo) setError(getApiErrorMessage(err, 'No pudimos cargar la configuración.'))
      })
      .finally(() => {
        if (activo) setLoading(false)
      })

    return () => { activo = false }
  }, [tenantId])

  const agregarServicio = async (event) => {
    event?.preventDefault()
    const nombre = nuevoServicio.nombre.trim()
    if (!nombre) {
      setErrorServicio('Escribe el nombre del servicio.')
      return
    }
    if (guardandoServicio) return

    setGuardandoServicio(true)
    setErrorServicio('')
    try {
      const servicio = await crearServicio({ nombre, duracion: nuevoServicio.duracion })
      setServicios(prev => [...prev, servicio])
      setNuevoServicio({ nombre: '', duracion: 30 })
    } catch (err) {
      setErrorServicio(getApiErrorMessage(err, 'No pudimos agregar el servicio.'))
    } finally {
      setGuardandoServicio(false)
    }
  }

  const confirmarEliminar = async () => {
    if (!aEliminar || eliminando) return
    setEliminando(aEliminar.id)
    setError('')
    try {
      await eliminarServicio(aEliminar.id)
      setServicios(prev => prev.filter(servicio => servicio.id !== aEliminar.id))
      setAEliminar(null)
    } catch (err) {
      setError(getApiErrorMessage(err, 'No pudimos eliminar el servicio.'))
      setAEliminar(null)
    } finally {
      setEliminando(null)
    }
  }

  const guardarHorarios = async () => {
    if (guardandoHorarios) return
    // Validar colaciones: fin debe ser mayor que inicio
    const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
    const DIAS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
    for (const h of horarios.filter(h => h.activo)) {
      if (h.inicioColacion && h.finColacion && toMin(h.finColacion) <= toMin(h.inicioColacion)) {
        setError(`La hora de fin de colación del ${DIAS[h.diaSemana]} debe ser mayor que la de inicio. Verifica que estés usando formato 24 h (ej: 14:00 para las 2 PM).`)
        return
      }
    }
    setGuardandoHorarios(true)
    setOkHorarios(false)
    setError('')
    try {
      await actualizarHorarios(horarios.filter(horario => horario.activo))
      setOkHorarios(true)
      window.setTimeout(() => setOkHorarios(false), 2500)
    } catch (err) {
      setError(getApiErrorMessage(err, 'No pudimos guardar los horarios.'))
    } finally {
      setGuardandoHorarios(false)
    }
  }

  const toggleDia = (index) => {
    setHorarios(prev => prev.map((horario, idx) => (
      idx === index ? { ...horario, activo: !horario.activo } : horario
    )))
  }

  const updateHorario = (index, campo, valor) => {
    setHorarios(prev => prev.map((horario, idx) => (
      idx === index ? { ...horario, [campo]: valor } : horario
    )))
  }

  const toggleExpandido = (index) => {
    setDiasExpandidos(prev => ({ ...prev, [index]: !prev[index] }))
  }

  const copiarHorario = () => {
    if (dialogoCopiar === null || diasDestino.length === 0) return
    const origen = horarios[dialogoCopiar]
    setHorarios(prev => prev.map((h, i) =>
      diasDestino.includes(i)
        ? { ...origen, diaSemana: i }
        : h
    ))
    setDialogoCopiar(null)
    setDiasDestino([])
  }

  const toggleDiaDestino = (index) => {
    setDiasDestino(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }

  // Genera opciones de horas en formato 24h cada 30 min (00:00 – 23:30)
  const HORAS_DIA = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2).toString().padStart(2, '0')
    const m = i % 2 === 0 ? '00' : '30'
    return `${h}:${m}`
  })

  const resumenHorario = (horario) => {
    if (!horario.activo) return null
    const { horaInicio, horaFin, inicioColacion, finColacion } = horario
    if (inicioColacion && finColacion) {
      return `${horaInicio} – ${inicioColacion} · ${finColacion} – ${horaFin}`
    }
    return `${horaInicio} – ${horaFin}`
  }

  const selectClass = (disabled) =>
    `h-9 rounded-md border border-line bg-surface px-2 text-sm text-ink transition-colors focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-400/25 ${disabled ? 'cursor-not-allowed opacity-50 bg-graphite-50' : ''}`

  const agregarBloqueo = async (e) => {
    e?.preventDefault()
    const { fecha, horaInicio, horaFin, motivo } = nuevoBloqueo
    if (!fecha) { setErrorBloqueo('Selecciona una fecha.'); return }
    if ((horaInicio && !horaFin) || (!horaInicio && horaFin)) {
      setErrorBloqueo('Debes indicar tanto la hora de inicio como la hora de fin, o dejar ambas vacías para bloquear el día completo.')
      return
    }
    if (guardandoBloqueo) return
    setGuardandoBloqueo(true)
    setErrorBloqueo('')
    try {
      const bloqueo = await crearBloqueo({ fecha, horaInicio: horaInicio || null, horaFin: horaFin || null, motivo: motivo || null })
      setBloqueos(prev => [...prev, bloqueo].sort((a, b) => new Date(a.fecha) - new Date(b.fecha)))
      setNuevoBloqueo({ fecha: '', horaInicio: '', horaFin: '', motivo: '' })
    } catch (err) {
      setErrorBloqueo(getApiErrorMessage(err, 'No pudimos crear el bloqueo.'))
    } finally {
      setGuardandoBloqueo(false)
    }
  }

  const quitarBloqueo = async (id) => {
    if (eliminandoBloqueo) return
    setEliminandoBloqueo(id)
    try {
      await eliminarBloqueo(id)
      setBloqueos(prev => prev.filter(b => b.id !== id))
    } catch (err) {
      setError(getApiErrorMessage(err, 'No pudimos eliminar el bloqueo.'))
    } finally {
      setEliminandoBloqueo(null)
    }
  }

  const handleCambiarPassword = async (e) => {
    e?.preventDefault()
    setErrorPassword('')
    setOkPassword(false)

    if (!formPassword.actual) {
      setErrorPassword('Ingresa tu contraseña actual.')
      return
    }
    if (formPassword.nueva.length < 8) {
      setErrorPassword('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (formPassword.nueva !== formPassword.confirmar) {
      setErrorPassword('Las contraseñas nuevas no coinciden.')
      return
    }
    if (guardandoPassword) return

    setGuardandoPassword(true)
    try {
      await cambiarPassword({ passwordActual: formPassword.actual, passwordNueva: formPassword.nueva })
      setOkPassword(true)
      setFormPassword({ actual: '', nueva: '', confirmar: '' })
      window.setTimeout(() => setOkPassword(false), 3000)
    } catch (err) {
      setErrorPassword(getApiErrorMessage(err, 'No pudimos cambiar la contraseña.'))
    } finally {
      setGuardandoPassword(false)
    }
  }

  const guardarPerfil = async (e) => {
    e?.preventDefault()
    if (!perfil.nombre.trim()) {
      setErrorPerfil('El nombre del taller es requerido.')
      return
    }
    if (guardandoPerfil) return
    setGuardandoPerfil(true)
    setErrorPerfil('')
    setOkPerfil(false)
    try {
      const tenantActualizado = await actualizarTenant({
        nombre: perfil.nombre.trim(),
        email: perfil.email.trim() || null,
        telefono: perfil.telefono.trim() || null,
        logoUrl: perfil.logoUrl.trim() || null
      })
      // Actualizar sesión local para que sidebar refleje cambios de inmediato
      saveSession({
        token: getToken(),
        usuario: { ...usuario, tenant: { ...usuario.tenant, ...tenantActualizado } }
      })
      setOkPerfil(true)
      window.setTimeout(() => setOkPerfil(false), 2500)
    } catch (err) {
      setErrorPerfil(getApiErrorMessage(err, 'No pudimos guardar el perfil del taller.'))
    } finally {
      setGuardandoPerfil(false)
    }
  }

  const formatearFechaBloqueo = (fechaISO) => {
    const d = new Date(fechaISO)
    return d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
  }

  return (
    <AdminLayout>
      <header>
        <p className="micro-label">Ajustes del taller</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">Configuración</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Define los servicios que ofreces y los días de atención disponibles para reservar.
        </p>
      </header>

      {error && (
        <Alert variant="error" className="mt-5" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Perfil del taller */}
      <section className="mt-6 rounded-xl border border-line bg-surface shadow-card">
        <div className="flex items-start gap-3 border-b border-line px-4 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
            <Store className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink">Perfil del taller</h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              Nombre, teléfono y logo que se muestran en el sitio público.
            </p>
          </div>
        </div>

        <form onSubmit={guardarPerfil} className="p-4 space-y-4">
          {errorPerfil && (
            <Alert variant="error" onDismiss={() => setErrorPerfil('')}>{errorPerfil}</Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="perfil-nombre" className="block text-xs font-medium text-ink-muted">
                Nombre del taller *
              </label>
              <Input
                id="perfil-nombre"
                value={perfil.nombre}
                onChange={e => setPerfil(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Taller Ewert"
                maxLength={80}
                required
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="perfil-telefono" className="block text-xs font-medium text-ink-muted">
                Teléfono de contacto
              </label>
              <Input
                id="perfil-telefono"
                value={perfil.telefono}
                onChange={e => setPerfil(prev => ({ ...prev, telefono: e.target.value }))}
                placeholder="+56 9 1234 5678"
                maxLength={30}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="perfil-email" className="block text-xs font-medium text-ink-muted">
                Correo del taller
                <span className="ml-1.5 font-normal text-ink-soft">(recibe avisos de nuevas reservas)</span>
              </label>
              <Input
                id="perfil-email"
                type="email"
                value={perfil.email}
                onChange={e => setPerfil(prev => ({ ...prev, email: e.target.value }))}
                placeholder="reservas@mitaller.cl"
                maxLength={120}
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="block text-xs font-medium text-ink-muted">Logo del taller</span>
            <div className="flex items-start gap-4">
              {/* Preview */}
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-line bg-graphite-50 overflow-hidden">
                {perfil.logoUrl && !logoPreviewError ? (
                  <img
                    src={perfil.logoUrl}
                    alt="Preview logo"
                    className="h-full w-full object-contain p-1.5"
                    onError={() => setLogoPreviewError(true)}
                    onLoad={() => setLogoPreviewError(false)}
                  />
                ) : (
                  <ImageIcon className="h-7 w-7 text-ink-soft" aria-hidden="true" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                {/* Botón subir archivo */}
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-graphite-50 focus-within:ring-2 focus-within:ring-accent-400/25">
                  <ImageIcon className="h-4 w-4 text-ink-muted" aria-hidden="true" />
                  {subiendoLogo ? 'Procesando…' : perfil.logoUrl ? 'Cambiar imagen' : 'Subir imagen'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={handleLogoFile}
                    disabled={subiendoLogo}
                  />
                </label>

                {perfil.logoUrl && (
                  <button
                    type="button"
                    onClick={() => { setPerfil(prev => ({ ...prev, logoUrl: '' })); setLogoPreviewError(false) }}
                    className="ml-2 text-xs text-danger-600 hover:underline"
                  >
                    Quitar logo
                  </button>
                )}

                <p className="text-[11px] leading-relaxed text-ink-soft">
                  PNG, JPG o WebP · máx. 5 MB. La imagen se comprime automáticamente.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-line pt-4">
            <Button
              type="submit"
              variant={okPerfil ? 'success' : 'dark'}
              leftIcon={okPerfil ? Check : Save}
              loading={guardandoPerfil}
            >
              {guardandoPerfil ? 'Guardando…' : okPerfil ? 'Guardado' : 'Guardar perfil'}
            </Button>
          </div>
        </form>
      </section>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-surface shadow-card">
          <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                <Wrench className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-ink">Servicios</h2>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Definen la duración de cada bloque de reserva.
                </p>
              </div>
            </div>
            {!loading && <Badge variant="neutral" size="sm">{servicios.length}</Badge>}
          </div>

          <div className="px-4 py-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 w-full" />
                ))}
              </div>
            ) : servicios.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-ink-muted">
                Aún no hay servicios. Agrega el primero para habilitar reservas.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {servicios.map(servicio => (
                  <li key={servicio.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{servicio.nombre}</p>
                      <p className="text-xs text-ink-muted">{servicio.duracion} minutos</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAEliminar(servicio)}
                      className="rounded-md p-2 text-ink-soft transition-colors hover:bg-danger-50 hover:text-danger-600 focus-ring"
                      aria-label={`Eliminar ${servicio.nombre}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={agregarServicio} className="mt-4 border-t border-line pt-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={nuevoServicio.nombre}
                  onChange={event => setNuevoServicio(prev => ({ ...prev, nombre: event.target.value }))}
                  placeholder="Nombre del servicio"
                  aria-label="Nombre del nuevo servicio"
                  invalid={Boolean(errorServicio)}
                  maxLength={80}
                />
                <div className="flex gap-2">
                  <Select
                    value={nuevoServicio.duracion}
                    onChange={event => setNuevoServicio(prev => ({ ...prev, duracion: Number(event.target.value) }))}
                    aria-label="Duración del servicio"
                    className="sm:w-28"
                  >
                    {DURACIONES.map(duracion => (
                      <option key={duracion} value={duracion}>{duracion} min</option>
                    ))}
                  </Select>
                  <Button
                    type="submit"
                    variant="dark"
                    leftIcon={Plus}
                    loading={guardandoServicio}
                    aria-label="Agregar servicio"
                    className="shrink-0"
                  >
                    Agregar
                  </Button>
                </div>
              </div>
              {errorServicio && (
                <p role="alert" className="mt-2 text-sm text-danger-600">{errorServicio}</p>
              )}
            </form>
          </div>
        </section>

        <section className="rounded-xl border border-line bg-surface shadow-card">
          <div className="flex items-start gap-3 border-b border-line px-4 py-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-graphite-100 text-graphite-600">
              <Clock className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-ink">Horarios de atención</h2>
              <p className="mt-0.5 text-xs text-ink-muted">
                Solo los días activos aparecen disponibles en el sitio público.
              </p>
            </div>
          </div>

          <div className="px-4 py-4">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {horarios.map((horario, index) => {
                  const expandido = !!diasExpandidos[index]
                  const resumen = resumenHorario(horario)
                  const tieneColacion = !!(horario.inicioColacion && horario.finColacion)

                  return (
                    <div
                      key={DIAS_SEMANA[index]}
                      className="rounded-lg border border-line overflow-hidden"
                    >
                      {/* Fila de cabecera (siempre visible) */}
                      <div className={`flex items-center gap-2 px-3 py-2.5 ${expandido ? 'bg-graphite-50' : 'bg-surface'}`}>
                        {/* Toggle activo */}
                        <button
                          type="button"
                          onClick={() => toggleDia(index)}
                          role="switch"
                          aria-checked={horario.activo}
                          aria-label={`Activar ${DIAS_SEMANA[index]}`}
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors focus-ring ${
                            horario.activo
                              ? 'border-accent-400 bg-accent-400 text-white'
                              : 'border-graphite-300 bg-surface'
                          }`}
                        >
                          {horario.activo && <Check className="h-3 w-3" aria-hidden="true" />}
                        </button>

                        {/* Nombre del día */}
                        <span className={`w-20 shrink-0 text-sm font-semibold ${horario.activo ? 'text-ink' : 'text-ink-soft'}`}>
                          {DIAS_SEMANA[index]}
                        </span>

                        {/* Badge estado */}
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          horario.activo
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-graphite-100 text-graphite-500'
                        }`}>
                          {horario.activo ? 'Abierto' : 'Cerrado'}
                        </span>

                        {/* Resumen horario (colapsado) */}
                        {!expandido && resumen && (
                          <span className="hidden sm:inline-block text-xs text-ink-soft truncate flex-1 ml-1">
                            {resumen}
                          </span>
                        )}

                        {/* Badge colación (colapsado) */}
                        {!expandido && tieneColacion && (
                          <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-600 shrink-0">
                            <UtensilsCrossed className="h-3 w-3" aria-hidden="true" />
                            {horario.inicioColacion} – {horario.finColacion}
                          </span>
                        )}

                        <div className="ml-auto flex items-center gap-1 shrink-0">
                          {/* Botón copiar */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setDialogoCopiar(index); setDiasDestino([]) }}
                            title="Copiar horario a otros días"
                            aria-label={`Copiar horario de ${DIAS_SEMANA[index]}`}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-graphite-100 hover:text-ink focus-ring"
                          >
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>

                          {/* Botón expandir */}
                          <button
                            type="button"
                            onClick={() => toggleExpandido(index)}
                            aria-expanded={expandido}
                            aria-label={expandido ? `Cerrar ${DIAS_SEMANA[index]}` : `Editar ${DIAS_SEMANA[index]}`}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-graphite-100 hover:text-ink focus-ring"
                          >
                            {expandido
                              ? <ChevronUp className="h-4 w-4" aria-hidden="true" />
                              : <ChevronDown className="h-4 w-4" aria-hidden="true" />
                            }
                          </button>
                        </div>
                      </div>

                      {/* Cuerpo expandido */}
                      {expandido && (
                        <div className="border-t border-line bg-graphite-50/40 px-4 py-4 space-y-4">
                          {/* Bloque Mañana */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                              Mañana
                            </span>
                            <select
                              value={horario.horaInicio}
                              disabled={!horario.activo}
                              onChange={e => updateHorario(index, 'horaInicio', e.target.value)}
                              aria-label={`Inicio mañana de ${DIAS_SEMANA[index]}`}
                              className={selectClass(!horario.activo)}
                            >
                              {HORAS_DIA.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                            <span className="text-xs text-ink-soft">a</span>
                            <select
                              value={horario.inicioColacion ?? ''}
                              disabled={!horario.activo}
                              onChange={e => updateHorario(index, 'inicioColacion', e.target.value || null)}
                              aria-label={`Fin mañana / inicio colación de ${DIAS_SEMANA[index]}`}
                              className={selectClass(!horario.activo)}
                            >
                              <option value="">— sin colación</option>
                              {HORAS_DIA.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                          </div>

                          {/* Badge colación */}
                          {tieneColacion && (
                            <div className="flex items-center gap-2">
                              <span className="w-16 shrink-0" />
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                                <UtensilsCrossed className="h-3 w-3" aria-hidden="true" />
                                Colación {horario.inicioColacion} – {horario.finColacion}
                              </span>
                            </div>
                          )}

                          {/* Bloque Tarde */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                              Tarde
                            </span>
                            <select
                              value={horario.finColacion ?? ''}
                              disabled={!horario.activo || !horario.inicioColacion}
                              onChange={e => updateHorario(index, 'finColacion', e.target.value || null)}
                              aria-label={`Fin colación / inicio tarde de ${DIAS_SEMANA[index]}`}
                              className={selectClass(!horario.activo || !horario.inicioColacion)}
                            >
                              <option value="">—</option>
                              {HORAS_DIA.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                            <span className="text-xs text-ink-soft">a</span>
                            <select
                              value={horario.horaFin}
                              disabled={!horario.activo}
                              onChange={e => updateHorario(index, 'horaFin', e.target.value)}
                              aria-label={`Fin jornada de ${DIAS_SEMANA[index]}`}
                              className={selectClass(!horario.activo)}
                            >
                              {HORAS_DIA.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                          </div>

                          {/* Limpiar colación */}
                          {tieneColacion && (
                            <div className="flex items-center gap-2">
                              <span className="w-16 shrink-0" />
                              <button
                                type="button"
                                onClick={() => { updateHorario(index, 'inicioColacion', null); updateHorario(index, 'finColacion', null) }}
                                className="text-xs text-ink-soft underline hover:text-ink transition-colors focus-ring rounded"
                              >
                                Quitar colación
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div className="mt-4 border-t border-line pt-4">
              {okHorarios && (
                <Alert variant="success" className="mb-3">
                  Horarios guardados correctamente.
                </Alert>
              )}
              <Button
                variant={okHorarios ? 'success' : 'dark'}
                size="lg"
                className="w-full"
                onClick={guardarHorarios}
                loading={guardandoHorarios}
                disabled={loading}
                leftIcon={okHorarios ? Check : Save}
              >
                {guardandoHorarios ? 'Guardando…' : okHorarios ? 'Guardado' : 'Guardar horarios'}
              </Button>
            </div>
          </div>
        </section>

        {/* Diálogo copiar horario */}
        {dialogoCopiar !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            role="dialog"
            aria-modal="true"
            aria-label="Copiar horario"
            onClick={e => { if (e.target === e.currentTarget) { setDialogoCopiar(null); setDiasDestino([]) } }}
          >
            <div className="w-full max-w-sm rounded-xl border border-line bg-surface shadow-xl p-5">
              <h3 className="text-sm font-semibold text-ink mb-1">
                Copiar horario de {DIAS_SEMANA[dialogoCopiar]}
              </h3>
              <p className="text-xs text-ink-muted mb-4">
                Selecciona los días a los que quieres aplicar este horario.
              </p>
              <div className="space-y-2 mb-5">
                {DIAS_SEMANA.map((dia, i) => {
                  if (i === dialogoCopiar) return null
                  const seleccionado = diasDestino.includes(i)
                  return (
                    <label key={dia} className="flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2 hover:bg-graphite-50 transition-colors">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                          seleccionado ? 'border-accent-400 bg-accent-400 text-white' : 'border-graphite-300 bg-surface'
                        }`}
                        onClick={() => toggleDiaDestino(i)}
                      >
                        {seleccionado && <Check className="h-3 w-3" aria-hidden="true" />}
                      </span>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={seleccionado}
                        onChange={() => toggleDiaDestino(i)}
                      />
                      <span className="text-sm text-ink">{dia}</span>
                    </label>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => { setDialogoCopiar(null); setDiasDestino([]) }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="dark"
                  className="flex-1"
                  disabled={diasDestino.length === 0}
                  onClick={copiarHorario}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sección bloqueos */}
      <section className="mt-4 rounded-xl border border-line bg-surface shadow-card">
        <div className="flex items-start gap-3 border-b border-line px-4 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
            <Ban className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink">Bloqueos y excepciones</h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              Bloquea un día completo o una franja horaria específica. Los clientes no podrán reservar en esos horarios.
            </p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {errorBloqueo && (
            <Alert variant="error" onDismiss={() => setErrorBloqueo('')}>{errorBloqueo}</Alert>
          )}

          {/* Formulario nuevo bloqueo */}
          <form onSubmit={agregarBloqueo} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">Fecha *</label>
              <Input
                type="date"
                value={nuevoBloqueo.fecha}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setNuevoBloqueo(prev => ({ ...prev, fecha: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">Desde (opcional)</label>
              <select
                value={nuevoBloqueo.horaInicio}
                onChange={e => setNuevoBloqueo(prev => ({ ...prev, horaInicio: e.target.value }))}
                aria-label="Hora de inicio del bloqueo"
                className={selectClass(false)}
              >
                <option value="">— día completo</option>
                {HORAS_DIA.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">Hasta (opcional)</label>
              <select
                value={nuevoBloqueo.horaFin}
                onChange={e => setNuevoBloqueo(prev => ({ ...prev, horaFin: e.target.value }))}
                aria-label="Hora de fin del bloqueo"
                className={selectClass(false)}
              >
                <option value="">—</option>
                {HORAS_DIA.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">Motivo (opcional)</label>
              <Input
                type="text"
                value={nuevoBloqueo.motivo}
                onChange={e => setNuevoBloqueo(prev => ({ ...prev, motivo: e.target.value }))}
                placeholder="Mantención de equipos"
                maxLength={80}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
              <Button
                type="submit"
                size="sm"
                leftIcon={Plus}
                loading={guardandoBloqueo}
              >
                Agregar bloqueo
              </Button>
            </div>
          </form>

          {/* Lista de bloqueos */}
          {bloqueos.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-4">No hay bloqueos programados.</p>
          ) : (
            <ul className="divide-y divide-line">
              {bloqueos.map(b => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink capitalize">{formatearFechaBloqueo(b.fecha)}</p>
                    <p className="text-xs text-ink-muted">
                      {b.horaInicio && b.horaFin
                        ? `${b.horaInicio} – ${b.horaFin}`
                        : 'Día completo'}
                      {b.motivo && ` · ${b.motivo}`}
                    </p>
                  </div>
                  <button
                    onClick={() => quitarBloqueo(b.id)}
                    disabled={eliminandoBloqueo === b.id}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-soft hover:bg-red-50 hover:text-red-500 disabled:opacity-50 transition-colors"
                    aria-label="Eliminar bloqueo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Sección cambio de contraseña */}
      <section className="mt-4 rounded-xl border border-line bg-surface shadow-card">
        <div className="flex items-start gap-3 border-b border-line px-4 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-graphite-100 text-graphite-600">
            <KeyRound className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink">Cambiar contraseña</h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              Actualiza la contraseña de tu cuenta de administrador.
            </p>
          </div>
        </div>

        <div className="p-4">
          {errorPassword && (
            <Alert variant="error" className="mb-4" onDismiss={() => setErrorPassword('')}>
              {errorPassword}
            </Alert>
          )}
          {okPassword && (
            <Alert variant="success" className="mb-4">
              Contraseña actualizada correctamente.
            </Alert>
          )}

          <form onSubmit={handleCambiarPassword} className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="pwd-actual" className="block text-xs font-medium text-ink-muted mb-1">
                Contraseña actual *
              </label>
              <Input
                id="pwd-actual"
                type="password"
                autoComplete="current-password"
                value={formPassword.actual}
                onChange={e => setFormPassword(prev => ({ ...prev, actual: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label htmlFor="pwd-nueva" className="block text-xs font-medium text-ink-muted mb-1">
                Nueva contraseña *
              </label>
              <Input
                id="pwd-nueva"
                type="password"
                autoComplete="new-password"
                value={formPassword.nueva}
                onChange={e => setFormPassword(prev => ({ ...prev, nueva: e.target.value }))}
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div>
              <label htmlFor="pwd-confirmar" className="block text-xs font-medium text-ink-muted mb-1">
                Confirmar nueva contraseña *
              </label>
              <Input
                id="pwd-confirmar"
                type="password"
                autoComplete="new-password"
                value={formPassword.confirmar}
                onChange={e => setFormPassword(prev => ({ ...prev, confirmar: e.target.value }))}
                placeholder="Repite la contraseña"
              />
            </div>
            <div className="sm:col-span-3 flex justify-end">
              <Button
                type="submit"
                variant={okPassword ? 'success' : 'dark'}
                leftIcon={okPassword ? Check : KeyRound}
                loading={guardandoPassword}
              >
                {guardandoPassword ? 'Guardando…' : okPassword ? 'Actualizada' : 'Cambiar contraseña'}
              </Button>
            </div>
          </form>
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(aEliminar)}
        onClose={() => { if (!eliminando) setAEliminar(null) }}
        onConfirm={confirmarEliminar}
        title="Eliminar servicio"
        description={aEliminar ? `“${aEliminar.nombre}” dejará de mostrarse en el sitio público.` : undefined}
        confirmLabel="Eliminar"
        loading={Boolean(eliminando)}
      />
    </AdminLayout>
  )
}

