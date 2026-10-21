const verifyTurnstile = async (req, res, next) => {
  const token = req.body['cf-turnstile-response']

  if (!token) {
    return res.status(400).json({ error: 'Verificación de seguridad requerida.' })
  }

  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: token,
          remoteip: req.ip
        })
      }
    )

    const data = await response.json()

    if (!data.success) {
      return res.status(400).json({
        error: 'Verificación de seguridad fallida. Recarga la página e intenta de nuevo.',
        codes: data['error-codes']
      })
    }

    next()
  } catch (err) {
    console.error('[Turnstile] Error al verificar token:', err)
    return res.status(500).json({ error: 'Error al verificar la seguridad. Intenta de nuevo.' })
  }
}

module.exports = verifyTurnstile
