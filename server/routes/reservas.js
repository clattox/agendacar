const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const {
  getReservas,
  getReservasPublicas,
  createReserva,
  updateEstado,
  getHorasDisponibles
} = require('../controllers/reservasController')

// Rutas públicas (cliente)
router.get('/disponibles', getHorasDisponibles)
router.post('/nueva', createReserva)

// Rutas privadas (admin)
router.get('/', auth, getReservas)
router.patch('/:id/estado', auth, updateEstado)

module.exports = router
