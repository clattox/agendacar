const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const verifyTurnstile = require('../middleware/verifyTurnstile')
const {
  getReservas,
  getReservasPublicas,
  createReserva,
  reagendarReserva,
  updateEstado,
  deleteReserva,
  getHorasDisponibles,
  exportarReservasCSV,
  asignarTrabajadores
} = require('../controllers/reservasController')

// Rutas públicas (cliente)
router.get('/disponibles', getHorasDisponibles)
router.post('/nueva', verifyTurnstile, createReserva)

// Rutas privadas (admin)
router.get('/exportar', auth, exportarReservasCSV)
router.get('/', auth, getReservas)
router.patch('/:id/estado', auth, updateEstado)
router.put('/:id/trabajadores', auth, asignarTrabajadores)
router.patch('/:id', auth, reagendarReserva)
router.delete('/:id', auth, deleteReserva)

module.exports = router
