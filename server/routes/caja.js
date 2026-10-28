const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { getResumen } = require('../controllers/cajaController')

router.get('/resumen', auth, getResumen)

module.exports = router
