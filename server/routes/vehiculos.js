const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { crearVehiculo, listarVehiculos, obtenerHistorialVehiculo, actualizarVehiculo } = require('../controllers/vehiculosController')
const { listarCatalogo, agregarCatalogo, eliminarCatalogo } = require('../controllers/catalogoController')

router.get('/', auth, listarVehiculos)
router.post('/', auth, crearVehiculo)

// Catálogo de marcas/modelos — rutas fijas ANTES de /:patente
router.get('/catalogo', listarCatalogo)                  // público (usa ?tenantId=X)
router.post('/catalogo', auth, agregarCatalogo)
router.delete('/catalogo/:id', auth, eliminarCatalogo)

router.get('/:patente', auth, obtenerHistorialVehiculo)
router.patch('/:patente', auth, actualizarVehiculo)

module.exports = router
