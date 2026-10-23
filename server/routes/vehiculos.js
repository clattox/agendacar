const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { listarVehiculos, obtenerHistorialVehiculo, actualizarVehiculo } = require('../controllers/vehiculosController')

router.get('/', auth, listarVehiculos)
router.get('/:patente', auth, obtenerHistorialVehiculo)
router.patch('/:patente', auth, actualizarVehiculo)

module.exports = router
