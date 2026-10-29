const express = require('express')
const router = express.Router()
const { checkRecordatorios } = require('../controllers/recordatorioController')

// GET /api/recordatorios/check
// Llamado por Render Cron Job cada hora
router.get('/check', checkRecordatorios)

module.exports = router
