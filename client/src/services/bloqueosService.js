import api from './api'

export const listarBloqueos = () =>
  api.get('/bloqueos').then(r => r.data)

export const crearBloqueo = (data) =>
  api.post('/bloqueos', data).then(r => r.data)

export const eliminarBloqueo = (id) =>
  api.delete(`/bloqueos/${id}`).then(r => r.data)
