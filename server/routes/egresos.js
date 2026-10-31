const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { listarEgresos, crearEgreso, eliminarEgreso } = require('../controllers/egresosController')

router.get('/',     auth, listarEgresos)
router.post('/',    auth, crearEgreso)
router.delete('/:id', auth, eliminarEgreso)

module.exports = router
