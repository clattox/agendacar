const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const verifyTurnstile = require('../middleware/verifyTurnstile')
const { login, cambiarPassword } = require('../controllers/authController')

router.post('/login', verifyTurnstile, login)
router.patch('/cambiar-password', auth, cambiarPassword)

module.exports = router
