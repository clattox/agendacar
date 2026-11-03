const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * GET /api/caja/resumen
 * Devuelve: total del día, total del mes y listado de cierres recientes.
 */
const getResumen = async (req, res) => {
  const tenantId = req.usuario?.tenantId
  if (!tenantId) return res.status(401).json({ error: 'Sin tenant' })

  const ahora = new Date()

  // Inicio del día en Santiago (UTC-3)
  const offsetMs = 3 * 60 * 60 * 1000
  const ahoraLocal = new Date(ahora.getTime() - offsetMs)
  const inicioDiaLocal = new Date(ahoraLocal)
  inicioDiaLocal.setHours(0, 0, 0, 0)
  const inicioDiaUTC = new Date(inicioDiaLocal.getTime() + offsetMs)

  // Inicio del mes
  const inicioMesLocal = new Date(ahoraLocal.getFullYear(), ahoraLocal.getMonth(), 1)
  const inicioMesUTC = new Date(inicioMesLocal.getTime() + offsetMs)

  try {
    // Cierres del día
    const cierresHoy = await prisma.cierreAtencion.findMany({
      where: {
        tenantId,
        createdAt: { gte: inicioDiaUTC }
      },
      include: { items: true }
    })

    // Cierres del mes
    const cierresMes = await prisma.cierreAtencion.findMany({
      where: {
        tenantId,
        createdAt: { gte: inicioMesUTC }
      },
      include: { items: true }
    })

    // Cierres recientes con datos de la reserva
    const recientes = await prisma.cierreAtencion.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        items: true,
        reserva: {
          select: {
            nombre: true,
            patente: true,
            fecha: true,
            servicio: { select: { nombre: true } },
            vehiculo: { select: { marca: true, modelo: true } }
          }
        }
      }
    })

    const calcTotal = (cierre) => {
      const subtotal = cierre.items.reduce((s, i) => s + (i.cantidad || 1) * (i.valor || 0), 0)
      return cierre.incluyeIva ? Math.round(subtotal * 1.19) : subtotal
    }

    const sumar = (cierres) =>
      cierres.reduce((s, c) => s + calcTotal(c), 0)

    res.json({
      totalHoy: sumar(cierresHoy),
      atencioneHoy: cierresHoy.length,
      totalMes: sumar(cierresMes),
      atencioneMes: cierresMes.length,
      recientes: recientes.map(c => ({
        id: c.id,
        createdAt: c.createdAt,
        notas: c.notas,
        incluyeIva: c.incluyeIva,
        total: calcTotal(c),
        reserva: c.reserva
      }))
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener resumen de caja' })
  }
}

module.exports = { getResumen }
