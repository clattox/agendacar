const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const {
  listarTrabajadores,
  crearTrabajador,
  actualizarTrabajador,
  eliminarTrabajador
} = require('../controllers/trabajadorController')

router.get('/',    auth, listarTrabajadores)
router.post('/',   auth, crearTrabajador)
router.patch('/:id', auth, actualizarTrabajador)
router.delete('/:id', auth, eliminarTrabajador)

module.exports = router
