const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { getCotizacion, upsertCotizacion, enviarEmailCotizacion, eliminarCotizacion } = require('../controllers/cotizacionController')

router.get('/:reservaId', auth, getCotizacion)
router.post('/:reservaId', auth, upsertCotizacion)
router.post('/:reservaId/email', auth, enviarEmailCotizacion)
router.delete('/:reservaId', auth, eliminarCotizacion)

module.exports = router
