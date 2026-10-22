import api from '../lib/api'

// Obtener todos los slots del tenant, opcionalmente filtrados por día
export async function listarSlots(diaSemana) {
  const params = diaSemana !== undefined ? { diaSemana } : {}
  const { data } = await api.get('/slots', { params })
  return data
}

// Reemplazar los slots de un día específico
// horas: array de strings "HH:MM"
export async function guardarSlotsDia(diaSemana, horas) {
  const { data } = await api.put('/slots/dia', { diaSemana, horas })
  return data
}

// Obtener la capacidad simultánea del tenant
export async function getCapacidad() {
  const { data } = await api.get('/slots/capacidad')
  return data.capacidad
}

// Actualizar la capacidad simultánea del tenant
export async function setCapacidad(capacidad) {
  const { data } = await api.put('/slots/capacidad', { capacidad })
  return data.capacidad
}
