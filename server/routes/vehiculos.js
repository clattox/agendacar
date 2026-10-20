const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { obtenerHistorialVehiculo } = require('../controllers/vehiculosController')

router.get('/:patente', auth, obtenerHistorialVehiculo)

module.exports = router
