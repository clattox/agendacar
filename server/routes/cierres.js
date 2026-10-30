const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { getCierre, upsertCierre, actualizarNotasCierre } = require('../controllers/cierreController')

router.get('/:reservaId', auth, getCierre)
router.post('/:reservaId', auth, upsertCierre)
router.patch('/:reservaId/notas', auth, actualizarNotasCierre)

module.exports = router
