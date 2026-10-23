const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { crearVehiculo, listarVehiculos, obtenerHistorialVehiculo, actualizarVehiculo } = require('../controllers/vehiculosController')

router.get('/', auth, listarVehiculos)
router.post('/', auth, crearVehiculo)
router.get('/:patente', auth, obtenerHistorialVehiculo)
router.patch('/:patente', auth, actualizarVehiculo)

module.exports = router
