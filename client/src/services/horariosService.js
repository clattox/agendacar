import api from '../lib/api'

export async function listarHorarios(tenantId) {
  const { data } = await api.get('/horarios', { params: { tenantId } })
  return data
}

export async function actualizarHorarios(horarios) {
  const { data } = await api.put('/horarios', { horarios })
  return data
}
