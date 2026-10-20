const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { getHistorial } = require('../controllers/vehiculosController')

router.get('/:patente', auth, getHistorial)

module.exports = router
