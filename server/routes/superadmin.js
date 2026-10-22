const express = require('express')
const router = express.Router()
const superadmin = require('../middleware/superadmin')
const { getTenants, createTenant, toggleTenant, updateTenant, getStats, resetPasswordTenant } = require('../controllers/superadminController')

router.get('/tenants', superadmin, getTenants)
router.post('/tenants', superadmin, createTenant)
router.patch('/tenants/:id', superadmin, toggleTenant)
router.put('/tenants/:id', superadmin, updateTenant)
router.post('/tenants/:id/reset-password', superadmin, resetPasswordTenant)
router.get('/stats', superadmin, getStats)

module.exports = router
