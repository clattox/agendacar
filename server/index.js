require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())

// Rutas
app.use('/api/auth', require('./routes/auth'))
app.use('/api/reservas', require('./routes/reservas'))
app.use('/api/servicios', require('./routes/servicios'))
app.use('/api/horarios', require('./routes/horarios'))
app.use('/api/tenant', require('./routes/tenant'))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`)
})
