require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'https://mediumspringgreen-capybara-442877.hostingersite.com',
  'https://agendacar.cl',
  'https://www.agendacar.cl',
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [])
]

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (Postman, curl, server-to-server)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origen no permitido → ${origin}`))
  },
  credentials: true
}))
app.use(express.json())

// Rutas
app.use('/api/auth', require('./routes/auth'))
app.use('/api/reservas', require('./routes/reservas'))
app.use('/api/servicios', require('./routes/servicios'))
app.use('/api/horarios', require('./routes/horarios'))
app.use('/api/tenant', require('./routes/tenant'))
app.use('/api/vehiculos', require('./routes/vehiculos'))
app.use('/api/estadisticas', require('./routes/estadisticas'))
app.use('/api/bloqueos', require('./routes/bloqueos'))
app.use('/api/slots', require('./routes/slots'))
app.use('/api/superadmin', require('./routes/superadmin'))
app.use('/api/inspecciones', require('./routes/inspecciones'))
app.use('/api/trabajadores', require('./routes/trabajadores'))
app.use('/api/cierres', require('./routes/cierres'))
app.use('/api/caja', require('./routes/caja'))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() })
})

// Ejecutar migraciones al iniciar
const runMigrations = require('./prisma/migrate')
runMigrations()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`)
    })
  })
  .catch(err => {
    console.error('Error en migraciones, iniciando igual:', err.message)
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`)
    })
  })
