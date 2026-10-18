const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { getHorarios, updateHorarios } = require('../controllers/horariosController')

router.get('/', getHorarios)
router.put('/', auth, updateHorarios)

module.exports = router
