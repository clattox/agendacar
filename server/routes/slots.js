const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { getSlots, setSlotsDia, getCapacidad, setCapacidad } = require('../controllers/slotsController')

// Todas las rutas de slots requieren autenticación
router.get('/', auth, getSlots)
router.put('/dia', auth, setSlotsDia)
router.get('/capacidad', auth, getCapacidad)
router.put('/capacidad', auth, setCapacidad)

module.exports = router
