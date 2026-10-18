const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { getServicios, createServicio, updateServicio, deleteServicio } = require('../controllers/serviciosController')

router.get('/', getServicios) // pública para el formulario de reserva
router.post('/', auth, createServicio)
router.put('/:id', auth, updateServicio)
router.delete('/:id', auth, deleteServicio)

module.exports = router
