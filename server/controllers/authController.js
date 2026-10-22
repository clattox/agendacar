const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const prisma = new PrismaClient()

const login = async (req, res) => {
  const { email, password } = req.body

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: { tenant: true }
    })

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    }

    const passwordValida = await bcrypt.compare(password, usuario.password)
    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    }

    const token = jwt.sign(
      { id: usuario.id, tenantId: usuario.tenantId, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        tenant: usuario.tenant
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error del servidor' })
  }
}

const cambiarPassword = async (req, res) => {
  const { passwordActual, passwordNueva } = req.body
  const usuarioId = req.usuario.id

  if (!passwordActual || !passwordNueva) {
    return res.status(400).json({ error: 'Debes ingresar la contraseña actual y la nueva.' })
  }

  if (passwordNueva.length < 8) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres.' })
  }

  try {
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } })
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado.' })
    }

    const passwordValida = await bcrypt.compare(passwordActual, usuario.password)
    if (!passwordValida) {
      return res.status(401).json({ error: 'La contraseña actual no es correcta.' })
    }

    const hash = await bcrypt.hash(passwordNueva, 10)
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { password: hash }
    })

    res.json({ ok: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error del servidor.' })
  }
}

const getUsuariosTenant = async (req, res) => {
  try {
    const tenantId = req.usuario.tenantId
    const usuarios = await prisma.usuario.findMany({
      where: { tenantId },
      select: { id: true, nombre: true, email: true, rol: true }
    })
    res.json(usuarios)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error del servidor.' })
  }
}

module.exports = { login, cambiarPassword, getUsuariosTenant }
