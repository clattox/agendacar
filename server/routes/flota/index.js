// routes/flota/index.js
// Agrega en app.js:  app.use('/api/flota', authMiddleware, require('./routes/flota'))

const router = require('express').Router()

router.use('/dashboard',   require('./dashboard'))
router.use('/vehiculos',   require('./vehiculos'))
router.use('/conductores', require('./conductores'))
router.use('/actividades', require('./actividades'))
router.use('/documentos',  require('./documentos'))

module.exports = router
