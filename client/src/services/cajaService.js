import api from '../lib/api'

export async function getResumenCaja() {
  const { data } = await api.get('/caja/resumen')
  return data
}
