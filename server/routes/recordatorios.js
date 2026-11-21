const express = require('express')
const router = express.Router()
const { checkRecordatorios } = require('../controllers/recordatorioController')
const { checkDocumentosAlerta } = require('../controllers/alertaDocumentoController')

// GET /api/recordatorios/check
// Llamado por Render Cron Job cada hora.
// Verifica el secret y ejecuta ambos procesos en paralelo:
//   1. Recordatorios de reservas del día siguiente
//   2. Alertas de documentos de flota próximos a vencer
router.get('/check', async (req, res) => {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers['x-cron-secret'] !== secret) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  // checkRecordatorios verifica su propio secret — lo pasamos como middleware interno
  // Para no duplicar la verificación, lo llamamos directo como función
  const [resRec, resDoc] = await Promise.allSettled([
    _runRecordatorios(req),
    checkDocumentosAlerta()
  ])

  res.json({
    recordatorios:      resRec.status === 'fulfilled' ? resRec.value  : { error: resRec.reason?.message },
    alertasDocumentos:  resDoc.status === 'fulfilled' ? resDoc.value : { error: resDoc.reason?.message }
  })
})

// Adaptador: llama a checkRecordatorios capturando su respuesta JSON
function _runRecordatorios (req) {
  return new Promise((resolve, reject) => {
    const fakeRes = {
      json:   (data) => resolve(data),
      status: (code) => ({ json: (data) => { code >= 400 ? reject(new Error(data?.error || String(code))) : resolve(data) } })
    }
    checkRecordatorios(req, fakeRes).catch(reject)
  })
}

module.exports = router
