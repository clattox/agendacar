const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { getBloqueos, createBloqueo, deleteBloqueo } = require('../controllers/bloqueosController')

router.get('/', auth, getBloqueos)
router.post('/', auth, createBloqueo)
router.delete('/:id', auth, deleteBloqueo)

module.exports = router
