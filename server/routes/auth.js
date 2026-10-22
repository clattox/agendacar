const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const verifyTurnstile = require('../middleware/verifyTurnstile')
const { login, cambiarPassword, getUsuariosTenant } = require('../controllers/authController')

router.post('/login', verifyTurnstile, login)
router.patch('/cambiar-password', auth, cambiarPassword)
router.get('/usuarios', auth, getUsuariosTenant)

module.exports = router
