import api from '../lib/api'

export const getTenants = () =>
  api.get('/superadmin/tenants').then(r => r.data)

export const createTenant = (data) =>
  api.post('/superadmin/tenants', data).then(r => r.data)

export const toggleTenant = (id) =>
  api.patch(`/superadmin/tenants/${id}`).then(r => r.data)

export const actualizarVencimiento = (id, vencimiento) =>
  api.patch(`/superadmin/tenants/${id}`, { vencimiento }).then(r => r.data)

export const getStats = () =>
  api.get('/superadmin/stats').then(r => r.data)

export const editarTenant = (id, data) =>
  api.put(`/superadmin/tenants/${id}`, data).then(r => r.data)

export const resetPasswordTenant = (id, nuevaPassword) =>
  api.post(`/superadmin/tenants/${id}/reset-password`, { nuevaPassword }).then(r => r.data)
