// routes/flota/index.js
const router = require('express').Router()
const requireFlota = require('../../middleware/requireFlota')

// Portal conductor: acceso directo sin verificar flotaActiva en tenant
// (el conductor pertenece a un tenant que ya tiene flota activa por definición)
// Solo conductores con rol=conductor pueden acceder a estas rutas
const soloRolConductor = (req, res, next) => {
  if (req.user?.rol !== 'conductor') {
    return res.status(403).json({ error: 'Acceso exclusivo para conductores' })
  }
  next()
}

router.use('/portal', soloRolConductor, require('./portalConductor'))

// Rutas admin: verifica módulo activo + rol admin
const soloAdmin = (req, res, next) => {
  if (req.user?.rol === 'conductor') {
    return res.status(403).json({ error: 'Sin acceso al panel de administración' })
  }
  next()
}

router.use(soloAdmin)
router.use(requireFlota)

router.use('/dashboard',   require('./dashboard'))
router.use('/vehiculos',   require('./vehiculos'))
router.use('/conductores', require('./conductores'))
router.use('/actividades', require('./actividades'))
router.use('/documentos',  require('./documentos'))
router.use('/reportes',    require('./reportes'))

module.exports = router
