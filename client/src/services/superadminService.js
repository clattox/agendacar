import api from '../lib/api'

export const getTenants = () =>
  api.get('/superadmin/tenants').then(r => r.data)

export const createTenant = (data) =>
  api.post('/superadmin/tenants', data).then(r => r.data)

export const toggleTenant = (id) =>
  api.patch(`/superadmin/tenants/${id}`).then(r => r.data)

export const getStats = () =>
  api.get('/superadmin/stats').then(r => r.data)
