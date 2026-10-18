const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { getTenant, updateTenant } = require('../controllers/tenantController')

router.get('/', getTenant) // pública para mostrar nombre/logo
router.put('/', auth, updateTenant)

module.exports = router
