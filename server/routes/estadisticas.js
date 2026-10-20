const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const {
  getResumen,
  getServicios,
  getDias
} = require('../controllers/estadisticasController')

router.get('/resumen', auth, getResumen)
router.get('/servicios', auth, getServicios)
router.get('/dias', auth, getDias)

module.exports = router
