const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { login, cambiarPassword } = require('../controllers/authController')

router.post('/login', login)
router.patch('/cambiar-password', auth, cambiarPassword)

module.exports = router
