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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`)
})
