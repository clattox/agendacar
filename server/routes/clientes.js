const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { listarClientes, actualizarCliente } = require('../controllers/clientesController')

router.get('/', auth, listarClientes)
router.patch('/:telefono', auth, actualizarCliente)

module.exports = router
