const express = require('express')
const router = express.Router()
const superadmin = require('../middleware/superadmin')
const { getTenants, createTenant, toggleTenant, getStats } = require('../controllers/superadminController')

router.get('/tenants', superadmin, getTenants)
router.post('/tenants', superadmin, createTenant)
router.patch('/tenants/:id', superadmin, toggleTenant)
router.get('/stats', superadmin, getStats)

module.exports = router
