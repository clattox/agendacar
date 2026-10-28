const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { getCierre, upsertCierre } = require('../controllers/cierreController')

router.get('/:reservaId', auth, getCierre)
router.post('/:reservaId', auth, upsertCierre)

module.exports = router
