const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { getTenant, getTenantMe, updateTenant } = require('../controllers/tenantController')

router.get('/',   getTenant)         // pública para mostrar nombre/logo
router.get('/me', auth, getTenantMe) // autenticada — devuelve tenant del usuario logueado
router.put('/',   auth, updateTenant)

module.exports = router
