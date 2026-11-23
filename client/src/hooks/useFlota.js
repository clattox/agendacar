// hooks/useFlota.js
// Hooks para todas las llamadas a la API de Control de Flota.
// Usa la instancia axios de lib/api (baseURL ya incluye /api).

import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'

// ——— Genérico ——————————————————————————————————————————————
function useQuery(path, deps = []) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const refetch = useCallback(async () => {
    if (!path) { setLoading(false); return }
    try {
      setLoading(true)
      setError(null)
      const res = await api.get(path)
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }, [path])  // eslint-disable-line

  useEffect(() => { refetch() }, deps)  // eslint-disable-line

  return { data, loading, error, refetch }
}

// ——— Dashboard ————————————————————————————————————————————
export function useDashboard(mes = '') {
  const path = mes ? `/flota/dashboard?mes=${mes}` : '/flota/dashboard'
  return useQuery(path, [mes])
}

export function useGastosHistorico(meses = 6) {
  return useQuery(`/flota/dashboard/gastos-historico?meses=${meses}`, [meses])
}

// ——— Vehículos ————————————————————————————————————————————
export function useVehiculos(filters = {}) {
  const params  = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v !== '' && v != null)
  ).toString()
  const path = `/flota/vehiculos${params ? '?' + params : ''}`
  return useQuery(path, [params])
}

export function useVehiculo(id) {
  return useQuery(id ? `/flota/vehiculos/${id}` : null, [id])
}

export function useVehiculoActividades(id, filters = {}) {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v !== '' && v != null)
  ).toString()
  const path = id
    ? `/flota/vehiculos/${id}/actividades${params ? '?' + params : ''}`
    : null
  return useQuery(path, [id, params])
}

export function useVehiculoEstadisticas(id, mes) {
  const path = id
    ? `/flota/vehiculos/${id}/estadisticas${mes ? '?mes=' + mes : ''}`
    : null
  return useQuery(path, [id, mes])
}

// ——— Conductores —————————————————————————————————————————
export function useConductores() {
  return useQuery('/flota/conductores?activo=true', [])
}

// ——— Documentos / vencimientos ————————————————————————————
export function useVencimientos(dias = 60) {
  return useQuery(`/flota/documentos/vencimientos?dias=${dias}`, [dias])
}

export function useDocumentosFlota(filters = {}) {
  const params = new URLSearchParams()
  if (filters.estado)     params.set('estado',     filters.estado)
  if (filters.tipo)       params.set('tipo',        filters.tipo)
  if (filters.vehiculoId) params.set('vehiculoId',  filters.vehiculoId)
  const qs = params.toString()
  return useQuery(`/flota/documentos${qs ? '?' + qs : ''}`, [filters.estado, filters.tipo, filters.vehiculoId])
}

// ——— Mutaciones ——————————————————————————————————————————

export function useRegistrarActividad() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const execute = useCallback(async (payload) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post('/flota/actividades', payload)
      return res.data
    } catch (err) {
      const msg = err.response?.data?.error || err.message
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, execute }
}

export function useCrearVehiculo() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const execute = useCallback(async (payload) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post('/flota/vehiculos', payload)
      return res.data
    } catch (err) {
      const msg = err.response?.data?.error || err.message
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, execute }
}

// Documentos de un vehículo específico
export function useDocumentosVehiculo(vehiculoId) {
  return useQuery(
    vehiculoId ? `/flota/documentos/vehiculo/${vehiculoId}` : null,
    [vehiculoId]
  )
}

// Crear documento con PDF
export function useCrearDocumento() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const execute = useCallback(async (vehiculoId, payload) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post(`/flota/documentos/vehiculo/${vehiculoId}`, payload)
      return res.data
    } catch (err) {
      const msg = err.response?.data?.error || err.message
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, execute }
}

// ——— Tenant info (nombre, logo) ——————————————————————————————
export function useTenantInfo() {
  return useQuery('/tenant/me', [])
}

// ——— Reporte mensual (admin) ————————————————————————————————
export function useReporteMensual(anio, vehiculoId) {
  const qs = vehiculoId
    ? `/flota/reportes/mensual?anio=${anio}&vehiculoId=${vehiculoId}`
    : `/flota/reportes/mensual?anio=${anio}`
  return useQuery(qs, [anio, vehiculoId])
}

// ——— Lista de vehículos para selector de reportes ————————————
export function useVehiculosLista() {
  return useQuery('/flota/reportes/vehiculos-lista', [])
}
