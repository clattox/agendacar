// routes/flota/index.js
const router = require('express').Router()
const requireFlota = require('../../middleware/requireFlota')

// Verifica módulo activo en todas las rutas de flota
router.use(requireFlota)

router.use('/dashboard',   require('./dashboard'))
router.use('/vehiculos',   require('./vehiculos'))
router.use('/conductores', require('./conductores'))
router.use('/actividades', require('./actividades'))
router.use('/documentos',  require('./documentos'))

module.exports = router
