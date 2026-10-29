import { useEffect, useState } from 'react'
import {
  Ban,
  Bell,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Eye,
  EyeOff,
  ImageIcon,
  KeyRound,
  MapPin,
  Pencil,
  Plus,
  Save,
  Store,
  Trash2,
  Users,
  UtensilsCrossed,
  Wrench,
  X
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
  actualizarServicio,
  crearServicio,
  eliminarServicio,
  listarServicios
} from '../../services/serviciosService'
import {
  crearBloqueo,
  eliminarBloqueo,
  listarBloqueos
} from '../../services/bloqueosService'
import {
  getCapacidad,
  guardarSlotsDia,
  listarSlots,
  setCapacidad
} from '../../services/slotsService'
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
  const [editandoServicio, setEditandoServicio] = useState(null) // { id, nombre, duracion }
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)
  const [errorEdicion, setErrorEdicion] = useState('')
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

  // Disponibilidad (capacidad + slots personalizados)
  const [capacidad, setCapacidadLocal] = useState(1)
  const [guardandoCapacidad, setGuardandoCapacidad] = useState(false)
  const [okCapacidad, setOkCapacidad] = useState(false)
  // slotsPorDia: { [diaSemana]: Set<string> }
  const [slotsPorDia, setSlotsPorDia] = useState({})
  const [diaActivoSlots, setDiaActivoSlots] = useState(1) // día seleccionado en la cuadrícula
  const [guardandoSlots, setGuardandoSlots] = useState(false)
  const [okSlots, setOkSlots] = useState(false)
  const [errorDisponibilidad, setErrorDisponibilidad] = useState('')
  const [showPassActual, setShowPassActual] = useState(false)
  const [showPassNueva, setShowPassNueva] = useState(false)
  const [showPassConfirm, setShowPassConfirm] = useState(false)

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
    direccion: usuario?.tenant?.direccion || '',
    logoUrl: usuario?.tenant?.logoUrl || '',
    inspeccionActiva: usuario?.tenant?.inspeccionActiva ?? false
  })
  const [logoPreviewError, setLogoPreviewError] = useState(false)
  const [subiendoLogo, setSubiendoLogo] = useState(false)
  const [guardandoPerfil, setGuardandoPerfil] = useState(false)
  const [okPerfil, setOkPerfil] = useState(false)
  const [errorPerfil, setErrorPerfil] = useState('')

  // Recordatorio diario
  const [recordatorio, setRecordatorio] = useState({
    activo: usuario?.tenant?.recordatorioActivo ?? false,
    hora: usuario?.tenant?.recordatorioHora ?? 20,
    dias: (usuario?.tenant?.recordatorioDias ?? '1,2,3,4,5').split(',').map(Number)
  })
  const [guardandoRecordatorio, setGuardandoRecordatorio] = useState(false)
  const [okRecordatorio, setOkRecordatorio] = useState(false)
  const [errorRecordatorio, setErrorRecordatorio] = useState('')

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

    Promise.all([
      listarServicios(tenantId),
      listarHorarios(tenantId),
      listarBloqueos(),
      listarSlots(),
      getCapacidad()
    ])
      .then(([serviciosData, horariosData, bloqueosData, slotsData, capacidadData]) => {
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
        // Construir mapa de slots por día
        const mapa = {}
        for (const s of slotsData) {
          if (!mapa[s.diaSemana]) mapa[s.diaSemana] = new Set()
          mapa[s.diaSemana].add(s.hora)
        }
        setSlotsPorDia(mapa)
        setCapacidadLocal(capacidadData)
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

  const iniciarEdicion = (servicio) => {
    setEditandoServicio({ id: servicio.id, nombre: servicio.nombre, duracion: servicio.duracion })
    setErrorEdicion('')
  }

  const cancelarEdicion = () => {
    setEditandoServicio(null)
    setErrorEdicion('')
  }

  const guardarEdicion = async (event) => {
    event?.preventDefault()
    const nombre = editandoServicio.nombre.trim()
    if (!nombre) {
      setErrorEdicion('Escribe el nombre del servicio.')
      return
    }
    if (guardandoEdicion) return

    setGuardandoEdicion(true)
    setErrorEdicion('')
    try {
      const actualizado = await actualizarServicio(editandoServicio.id, {
        nombre,
        duracion: editandoServicio.duracion,
      })
      setServicios(prev => prev.map(s => s.id === actualizado.id ? actualizado : s))
      setEditandoServicio(null)
    } catch (err) {
      setErrorEdicion(getApiErrorMessage(err, 'No pudimos actualizar el servicio.'))
    } finally {
      setGuardandoEdicion(false)
    }
  }

  const toggleRequiereInspeccion = async (servicio) => {
    try {
      const actualizado = await actualizarServicio(servicio.id, {
        nombre: servicio.nombre,
        duracion: servicio.duracion,
        requiereInspeccion: !servicio.requiereInspeccion
      })
      setServicios(prev => prev.map(s => s.id === actualizado.id ? actualizado : s))
    } catch (err) {
      setError(getApiErrorMessage(err, 'No pudimos actualizar el servicio.'))
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

  // Horas disponibles para la cuadrícula de slots (cada 30 min)
  const HORAS_CUADRICULA = Array.from({ length: 30 }, (_, i) => {
    // 07:00 a 21:30
    const totalMin = 7 * 60 + i * 30
    const h = Math.floor(totalMin / 60).toString().padStart(2, '0')
    const m = (totalMin % 60).toString().padStart(2, '0')
    return `${h}:${m}`
  })

  const toggleSlot = (hora) => {
    setSlotsPorDia(prev => {
      const actual = new Set(prev[diaActivoSlots] || [])
      if (actual.has(hora)) {
        actual.delete(hora)
      } else {
        actual.add(hora)
      }
      return { ...prev, [diaActivoSlots]: actual }
    })
  }

  const seleccionarTodosSlots = () => {
    setSlotsPorDia(prev => ({
      ...prev,
      [diaActivoSlots]: new Set(HORAS_CUADRICULA)
    }))
  }

  const limpiarSlots = () => {
    setSlotsPorDia(prev => ({
      ...prev,
      [diaActivoSlots]: new Set()
    }))
  }

  const guardarSlotsDelDia = async () => {
    if (guardandoSlots) return
    setGuardandoSlots(true)
    setOkSlots(false)
    setErrorDisponibilidad('')
    try {
      const horas = Array.from(slotsPorDia[diaActivoSlots] || []).sort()
      await guardarSlotsDia(diaActivoSlots, horas)
      setOkSlots(true)
      window.setTimeout(() => setOkSlots(false), 2500)
    } catch (err) {
      setErrorDisponibilidad(getApiErrorMessage(err, 'No pudimos guardar las horas.'))
    } finally {
      setGuardandoSlots(false)
    }
  }

  const guardarCapacidadTaller = async (nuevaCap) => {
    const cap = parseInt(nuevaCap)
    if (Number.isNaN(cap) || cap < 1 || cap > 4) return
    setGuardandoCapacidad(true)
    setOkCapacidad(false)
    setErrorDisponibilidad('')
    try {
      await setCapacidad(cap)
      setCapacidadLocal(cap)
      setOkCapacidad(true)
      window.setTimeout(() => setOkCapacidad(false), 2000)
    } catch (err) {
      setErrorDisponibilidad(getApiErrorMessage(err, 'No pudimos actualizar la capacidad.'))
    } finally {
      setGuardandoCapacidad(false)
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
        direccion: perfil.direccion.trim() || null,
        logoUrl: perfil.logoUrl.trim() || null,
        inspeccionActiva: perfil.inspeccionActiva
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

  const guardarRecordatorio = async (e) => {
    e?.preventDefault()
    if (guardandoRecordatorio) return
    setGuardandoRecordatorio(true)
    setErrorRecordatorio('')
    setOkRecordatorio(false)
    try {
      const tenantActualizado = await actualizarTenant({
        nombre: perfil.nombre.trim() || usuario?.tenant?.nombre,
        email: perfil.email.trim() || usuario?.tenant?.email,
        telefono: perfil.telefono.trim() || null,
        direccion: perfil.direccion.trim() || null,
        logoUrl: perfil.logoUrl.trim() || null,
        inspeccionActiva: perfil.inspeccionActiva,
        recordatorioActivo: recordatorio.activo,
        recordatorioHora: recordatorio.hora,
        recordatorioDias: recordatorio.dias.sort((a, b) => a - b).join(',')
      })
      const usuarioActual = getUsuario() || usuario
      saveSession({
        token: getToken(),
        usuario: { ...usuarioActual, tenant: { ...usuarioActual.tenant, ...tenantActualizado } }
      })
      setRecordatorio({
        activo: tenantActualizado.recordatorioActivo !== undefined ? Boolean(tenantActualizado.recordatorioActivo) : recordatorio.activo,
        hora: tenantActualizado.recordatorioHora !== undefined ? Number(tenantActualizado.recordatorioHora) : recordatorio.hora,
        dias: (tenantActualizado.recordatorioDias !== undefined ? tenantActualizado.recordatorioDias : recordatorio.dias.join(',')).split(',').map(Number)
      })
      setOkRecordatorio(true)
      window.setTimeout(() => setOkRecordatorio(false), 2500)
    } catch (err) {
      setErrorRecordatorio(getApiErrorMessage(err, 'No pudimos guardar la configuración de recordatorio.'))
    } finally {
      setGuardandoRecordatorio(false)
    }
  }

  const toggleDiaRecordatorio = (dia) => {
    setRecordatorio(prev => ({
      ...prev,
      dias: prev.dias.includes(dia)
        ? prev.dias.filter(d => d !== dia)
        : [...prev.dias, dia]
    }))
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
            <div className="space-y-1">
              <label htmlFor="perfil-direccion" className="block text-xs font-medium text-ink-muted">
                Dirección física
              </label>
              <Input
                id="perfil-direccion"
                value={perfil.direccion}
                onChange={e => setPerfil(prev => ({ ...prev, direccion: e.target.value }))}
                placeholder="Av. Principal 123, Ciudad"
                maxLength={200}
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

          {/* Toggle inspección previa */}
          <div className="flex items-start justify-between gap-4 rounded-lg border border-line bg-graphite-50 p-4">
            <div>
              <p className="text-sm font-semibold text-ink">Inspección previa de vehículos</p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Activa este módulo para registrar el estado del vehículo antes de cada atención.
                Puedes habilitarlo por servicio en la sección de Servicios.
              </p>
            </div>
            <label className="relative flex cursor-pointer items-center shrink-0 mt-0.5">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={perfil.inspeccionActiva}
                onChange={e => setPerfil(prev => ({ ...prev, inspeccionActiva: e.target.checked }))}
              />
              <div className="h-5 w-9 rounded-full border border-line bg-graphite-200 peer-checked:bg-accent-600 peer-focus:ring-2 peer-focus:ring-accent-400/30 transition-colors after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:border after:border-line after:transition-all peer-checked:after:translate-x-4" />
            </label>
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
                  <li key={servicio.id} className="py-2.5">
                    {editandoServicio?.id === servicio.id ? (
                      <form onSubmit={guardarEdicion} className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Input
                            value={editandoServicio.nombre}
                            onChange={e => setEditandoServicio(prev => ({ ...prev, nombre: e.target.value }))}
                            aria-label="Nombre del servicio"
                            invalid={Boolean(errorEdicion)}
                            maxLength={80}
                            autoFocus
                          />
                          <Select
                            value={editandoServicio.duracion}
                            onChange={e => setEditandoServicio(prev => ({ ...prev, duracion: Number(e.target.value) }))}
                            aria-label="Duración"
                            className="w-24 shrink-0"
                          >
                            {DURACIONES.map(d => (
                              <option key={d} value={d}>{d} min</option>
                            ))}
                          </Select>
                        </div>
                        {errorEdicion && (
                          <p role="alert" className="text-xs text-danger-600">{errorEdicion}</p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            size="sm"
                            variant="dark"
                            leftIcon={Check}
                            loading={guardandoEdicion}
                          >
                            Guardar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            leftIcon={X}
                            onClick={cancelarEdicion}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">{servicio.nombre}</p>
                          <p className="text-xs text-ink-muted">{servicio.duracion} minutos</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {perfil.inspeccionActiva && (
                            <label
                              className="flex items-center gap-1.5 cursor-pointer select-none"
                              title={servicio.requiereInspeccion ? 'Requiere inspección previa (activa)' : 'No requiere inspección previa'}
                            >
                              <span className="text-[10px] text-ink-soft hidden sm:inline">Inspección</span>
                              <div className="relative flex items-center">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={!!servicio.requiereInspeccion}
                                  onChange={() => toggleRequiereInspeccion(servicio)}
                                />
                                <div className="h-4 w-7 rounded-full border border-line bg-graphite-200 peer-checked:bg-accent-600 transition-colors after:absolute after:top-0.5 after:left-0.5 after:h-3 after:w-3 after:rounded-full after:bg-white after:border after:border-line after:transition-all peer-checked:after:translate-x-3" />
                              </div>
                            </label>
                          )}
                          <button
                            type="button"
                            onClick={() => iniciarEdicion(servicio)}
                            className="rounded-md p-2 text-ink-soft transition-colors hover:bg-graphite-50 hover:text-ink focus-ring"
                            aria-label={`Editar ${servicio.nombre}`}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setAEliminar(servicio)}
                            className="rounded-md p-2 text-ink-soft transition-colors hover:bg-danger-50 hover:text-danger-600 focus-ring"
                            aria-label={`Eliminar ${servicio.nombre}`}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    )}
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

      {/* Sección disponibilidad */}
      <section className="mt-4 rounded-xl border border-line bg-surface shadow-card">
        <div className="flex items-start gap-3 border-b border-line px-4 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
            <Users className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink">Disponibilidad</h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              Cuántos vehículos pueden reservar al mismo tiempo y qué horas ofreces cada día.
            </p>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {errorDisponibilidad && (
            <Alert variant="error" onDismiss={() => setErrorDisponibilidad('')}>{errorDisponibilidad}</Alert>
          )}

          {/* Capacidad simultánea */}
          <div>
            <p className="text-xs font-semibold text-ink mb-1">Vehículos simultáneos</p>
            <p className="text-xs text-ink-muted mb-3">
              Cuántas reservas se pueden aceptar al mismo tiempo. Si tienes un solo par de mecánicos, elige 1.
            </p>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => guardarCapacidadTaller(n)}
                  disabled={guardandoCapacidad}
                  className={`flex h-12 w-14 flex-col items-center justify-center rounded-xl border-2 text-sm font-bold transition-all focus-ring disabled:opacity-60 ${
                    capacidad === n
                      ? 'border-accent-400 bg-accent-50 text-accent-700'
                      : 'border-line bg-surface text-ink hover:border-graphite-300 hover:bg-graphite-50'
                  }`}
                  aria-pressed={capacidad === n}
                  aria-label={`${n} vehículo${n > 1 ? 's' : ''} simultáneo${n > 1 ? 's' : ''}`}
                >
                  <span className="text-lg leading-none">{n}</span>
                  <span className="mt-0.5 text-[10px] font-normal opacity-70">
                    {n === 1 ? 'auto' : 'autos'}
                  </span>
                </button>
              ))}
              {okCapacidad && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 self-center ml-1">
                  <Check className="h-3.5 w-3.5" /> Guardado
                </span>
              )}
            </div>
          </div>

          {/* Horas de inicio personalizadas */}
          <div>
            <p className="text-xs font-semibold text-ink mb-1">Horas de inicio por día</p>
            <p className="text-xs text-ink-muted mb-3">
              Selecciona qué horas ofreces para iniciar una reserva. Si un día no tiene horas marcadas, se generan automáticamente desde el horario de atención.
            </p>

            {/* Selector de día */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {DIAS_SEMANA.map((dia, i) => {
                const count = (slotsPorDia[i] || new Set()).size
                return (
                  <button
                    key={dia}
                    type="button"
                    onClick={() => setDiaActivoSlots(i)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-ring ${
                      diaActivoSlots === i
                        ? 'bg-graphite-800 text-white'
                        : 'bg-graphite-100 text-ink hover:bg-graphite-200'
                    }`}
                  >
                    {dia.slice(0, 3)}
                    {count > 0 && (
                      <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        diaActivoSlots === i ? 'bg-white/20 text-white' : 'bg-accent-100 text-accent-700'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Cuadrícula de horas */}
            <div className="rounded-xl border border-line bg-graphite-50/50 p-3">
              <p className="mb-2 text-xs font-semibold text-ink">
                {DIAS_SEMANA[diaActivoSlots]}
                {(slotsPorDia[diaActivoSlots] || new Set()).size > 0 ? (
                  <span className="ml-2 font-normal text-ink-muted">
                    {(slotsPorDia[diaActivoSlots] || new Set()).size} hora{(slotsPorDia[diaActivoSlots] || new Set()).size !== 1 ? 's' : ''} seleccionada{(slotsPorDia[diaActivoSlots] || new Set()).size !== 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="ml-2 font-normal text-ink-soft">automático</span>
                )}
              </p>

              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-8">
                {HORAS_CUADRICULA.map(hora => {
                  const activo = (slotsPorDia[diaActivoSlots] || new Set()).has(hora)
                  return (
                    <button
                      key={hora}
                      type="button"
                      onClick={() => toggleSlot(hora)}
                      aria-pressed={activo}
                      className={`rounded-lg py-2 text-xs font-medium transition-all focus-ring ${
                        activo
                          ? 'bg-accent-500 text-white shadow-sm'
                          : 'bg-surface border border-line text-ink-muted hover:border-graphite-300 hover:text-ink'
                      }`}
                    >
                      {hora}
                    </button>
                  )
                })}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={seleccionarTodosSlots}
                    className="text-xs text-ink-muted underline hover:text-ink transition-colors"
                  >
                    Seleccionar todas
                  </button>
                  <span className="text-ink-soft text-xs">·</span>
                  <button
                    type="button"
                    onClick={limpiarSlots}
                    className="text-xs text-ink-muted underline hover:text-ink transition-colors"
                  >
                    Limpiar
                  </button>
                </div>
                <Button
                  size="sm"
                  variant={okSlots ? 'success' : 'dark'}
                  leftIcon={okSlots ? Check : Save}
                  loading={guardandoSlots}
                  onClick={guardarSlotsDelDia}
                >
                  {okSlots ? 'Guardado' : `Guardar ${DIAS_SEMANA[diaActivoSlots].slice(0, 3)}.`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      {/* Sección recordatorio diario */}
      <section className="mt-4 rounded-xl border border-line bg-surface shadow-card">
        <div className="flex items-start gap-3 border-b border-line px-4 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
            <Bell className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink">Recordatorio diario</h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              Recibe un correo automático con las reservas del día siguiente, antes de empezar la jornada.
            </p>
          </div>
        </div>

        <form onSubmit={guardarRecordatorio} className="p-4 space-y-4">
          {errorRecordatorio && (
            <Alert variant="error" onDismiss={() => setErrorRecordatorio('')}>{errorRecordatorio}</Alert>
          )}

          {/* Toggle activo */}
          <div className="flex items-start justify-between gap-4 rounded-lg border border-line bg-graphite-50 p-4">
            <div>
              <p className="text-sm font-semibold text-ink">Activar recordatorio</p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Se enviará al correo del taller ({perfil.email || usuario?.tenant?.email || 'no configurado'}).
              </p>
            </div>
            <label className="relative flex cursor-pointer items-center shrink-0 mt-0.5">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={recordatorio.activo}
                onChange={e => setRecordatorio(prev => ({ ...prev, activo: e.target.checked }))}
              />
              <div className="h-5 w-9 rounded-full border border-line bg-graphite-200 peer-checked:bg-amber-500 peer-focus:ring-2 peer-focus:ring-amber-400/30 transition-colors after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:border after:border-line after:transition-all peer-checked:after:translate-x-4" />
            </label>
          </div>

          {/* Hora de envío */}
          <div className={`space-y-2 transition-opacity ${recordatorio.activo ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <p className="text-xs font-semibold text-ink">Hora de envío (hora Chile)</p>
            <p className="text-xs text-ink-muted">¿A qué hora del día anterior quieres recibir el resumen?</p>
            <div className="flex flex-wrap gap-2">
              {[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map(h => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setRecordatorio(prev => ({ ...prev, hora: h }))}
                  className={`rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all focus-ring ${
                    recordatorio.hora === h
                      ? 'border-amber-400 bg-amber-50 text-amber-700'
                      : 'border-line bg-surface text-ink hover:border-graphite-300 hover:bg-graphite-50'
                  }`}
                  aria-pressed={recordatorio.hora === h}
                >
                  {h}:00
                </button>
              ))}
            </div>
          </div>

          {/* Días de la semana */}
          <div className={`space-y-2 transition-opacity ${recordatorio.activo ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <p className="text-xs font-semibold text-ink">Días de envío</p>
            <p className="text-xs text-ink-muted">En qué días quieres recibir el recordatorio (se envía el día anterior al del trabajo).</p>
            <div className="flex flex-wrap gap-2">
              {DIAS_SEMANA.map((dia, i) => {
                const activo = recordatorio.dias.includes(i)
                return (
                  <button
                    key={dia}
                    type="button"
                    onClick={() => toggleDiaRecordatorio(i)}
                    className={`rounded-xl border-2 px-3 py-2 text-xs font-semibold transition-all focus-ring ${
                      activo
                        ? 'border-amber-400 bg-amber-50 text-amber-700'
                        : 'border-line bg-surface text-ink-soft hover:border-graphite-300'
                    }`}
                    aria-pressed={activo}
                  >
                    {dia.slice(0, 3)}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end border-t border-line pt-4">
            <Button
              type="submit"
              variant={okRecordatorio ? 'success' : 'dark'}
              leftIcon={okRecordatorio ? Check : Save}
              loading={guardandoRecordatorio}
            >
              {guardandoRecordatorio ? 'Guardando…' : okRecordatorio ? 'Guardado' : 'Guardar recordatorio'}
            </Button>
          </div>
        </form>
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
              <div className="relative">
                <Input
                  id="pwd-actual"
                  type={showPassActual ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formPassword.actual}
                  onChange={e => setFormPassword(prev => ({ ...prev, actual: e.target.value }))}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPassActual(v => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors" aria-label={showPassActual ? 'Ocultar' : 'Ver'}>
                  {showPassActual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="pwd-nueva" className="block text-xs font-medium text-ink-muted mb-1">
                Nueva contraseña *
              </label>
              <div className="relative">
                <Input
                  id="pwd-nueva"
                  type={showPassNueva ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formPassword.nueva}
                  onChange={e => setFormPassword(prev => ({ ...prev, nueva: e.target.value }))}
                  placeholder="Mínimo 8 caracteres"
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPassNueva(v => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors" aria-label={showPassNueva ? 'Ocultar' : 'Ver'}>
                  {showPassNueva ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="pwd-confirmar" className="block text-xs font-medium text-ink-muted mb-1">
                Confirmar nueva contraseña *
              </label>
              <div className="relative">
                <Input
                  id="pwd-confirmar"
                  type={showPassConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formPassword.confirmar}
                  onChange={e => setFormPassword(prev => ({ ...prev, confirmar: e.target.value }))}
                  placeholder="Repite la contraseña"
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPassConfirm(v => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors" aria-label={showPassConfirm ? 'Ocultar' : 'Ver'}>
                  {showPassConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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

