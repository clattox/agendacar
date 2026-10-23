const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { obtenerHistorialVehiculo, actualizarVehiculo } = require('../controllers/vehiculosController')

router.get('/:patente', auth, obtenerHistorialVehiculo)
router.patch('/:patente', auth, actualizarVehiculo)

module.exports = router
