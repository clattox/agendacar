const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const {
  getInspeccion,
  upsertInspeccion,
  confirmarInspeccion,
  getHistorialVehiculo
} = require('../controllers/inspeccionController')

// Todas las rutas requieren autenticación admin
router.get('/vehiculo/:patente', auth, getHistorialVehiculo)
router.get('/:reservaId', auth, getInspeccion)
router.post('/:reservaId', auth, upsertInspeccion)
router.patch('/:reservaId/confirmar', auth, confirmarInspeccion)

module.exports = router
