// routes/flota/actividades.js
// El endpoint más importante: registra cualquier tipo de actividad
// en una transacción atómica y actualiza el estado del vehículo.

const router = require('express').Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// ——— POST /api/flota/actividades ——————————————————————————————
//
// Body común (todos los tipos):
// {
//   vehiculoId:      string   (obligatorio)
//   tipo:            TipoActividad  (obligatorio)
//   fecha:           string ISO
//   registradoPorId: string   (conductorId del usuario que registra)
//   notas:           string
//   // + objeto específico según tipo (ver abajo)
// }

router.post('/', async (req, res) => {
  try {
    const { tenantId } = req.user
    const { vehiculoId, tipo, fecha, registradoPorId, notas, ...detalleRaw } = req.body

    // Validación básica
    if (!vehiculoId || !tipo) {
      return res.status(400).json({ error: 'vehiculoId y tipo son obligatorios' })
    }

    const TIPOS = ['KILOMETRAJE', 'COMBUSTIBLE', 'PEAJE', 'MANTENCION', 'CAMBIO_ESTADO', 'TRASLADO']
    if (!TIPOS.includes(tipo)) {
      return res.status(400).json({ error: `tipo inválido. Valores permitidos: ${TIPOS.join(', ')}` })
    }

    // Verificar que el vehículo pertenece al tenant
    const vehiculo = await prisma.flotaVehiculo.findFirst({
      where: { id: vehiculoId, tenantId },
    })
    if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado' })

    // Ejecutar todo en una transacción
    const resultado = await prisma.$transaction(async (tx) => {

      // 1. Crear el registro central
      const actividad = await tx.flotaActividad.create({
        data: {
          tenantId,
          vehiculoId,
          tipo,
          fecha:           fecha ? new Date(fecha) : new Date(),
          registradoPorId: registradoPorId || null,
          notas:           notas || null,
        },
      })

      // 2. Crear el detalle según el tipo
      switch (tipo) {

        // —— KILOMETRAJE ——
        case 'KILOMETRAJE': {
          const { odometroActual } = detalleRaw
          if (!odometroActual) throw new Error('odometroActual es obligatorio para KILOMETRAJE')
          if (odometroActual <= vehiculo.odometroActual) {
            throw new Error(
              `El odómetro (${odometroActual}) debe ser mayor al último registro (${vehiculo.odometroActual})`
            )
          }
          const kmRecorridos = odometroActual - vehiculo.odometroActual
          await tx.kmRegistro.create({
            data: { actividadId: actividad.id, odometroActual, kmRecorridos },
          })
          // Actualizar odómetro del vehículo
          await tx.flotaVehiculo.update({
            where: { id: vehiculoId },
            data:  { odometroActual },
          })
          break
        }

        // —— COMBUSTIBLE ——
        case 'COMBUSTIBLE': {
          const { tipoCombustible, litros, monto, odometroAlCargar, estacion, ciudadEstacion } = detalleRaw
          if (!tipoCombustible || !litros || !monto) {
            throw new Error('tipoCombustible, litros y monto son obligatorios para COMBUSTIBLE')
          }
          const precioLitro = Math.round(monto / litros)
          await tx.combustibleRegistro.create({
            data: {
              actividadId: actividad.id,
              tipoCombustible,
              litros,
              monto,
              precioLitro,
              odometroAlCargar: odometroAlCargar || null,
              estacion:         estacion || null,
              ciudadEstacion:   ciudadEstacion || null,
            },
          })
          // Si viene odómetro al cargar y es mayor al actual, actualizar
          if (odometroAlCargar && odometroAlCargar > vehiculo.odometroActual) {
            await tx.flotaVehiculo.update({
              where: { id: vehiculoId },
              data:  { odometroActual: odometroAlCargar },
            })
          }
          break
        }

        // —— PEAJE ——
        case 'PEAJE': {
          const { monto, autopista, sentido, proposito, esTag } = detalleRaw
          // Si es tag, el monto es opcional (el admin lo carga después)
          if (!esTag && !monto) throw new Error('monto es obligatorio para PEAJE sin tag')
          await tx.peajeRegistro.create({
            data: {
              actividadId: actividad.id,
              monto:       monto || 0,
              esTag:       !!esTag,
              autopista:   autopista || null,
              sentido:     sentido || 'IDA',
              proposito:   proposito || null,
            },
          })
          break
        }

        // —— MANTENCIÓN ——
        case 'MANTENCION': {
          const { tipoMantencion, descripcion, taller, costo, odometro,
                  numeroFolio, proxFecha, proxKm } = detalleRaw
          if (!tipoMantencion) throw new Error('tipoMantencion es obligatorio para MANTENCION')

          await tx.mantencionRegistro.create({
            data: {
              actividadId:  actividad.id,
              tipo:         tipoMantencion,
              descripcion:  descripcion || null,
              taller:       taller || null,
              costo:        costo || null,
              odometro:     odometro || null,
              numeroFolio:  numeroFolio || null,
              proxFecha:    proxFecha ? new Date(proxFecha) : null,
              proxKm:       proxKm || null,
            },
          })

          // Actualizar próxima mantención del vehículo si se informó
          if (proxFecha || proxKm) {
            await tx.flotaVehiculo.update({
              where: { id: vehiculoId },
              data: {
                ...(proxFecha && { proxMantencionFecha: new Date(proxFecha) }),
                ...(proxKm    && { proxMantencionKm:    proxKm }),
              },
            })
          }

          // Si es un documento legal (RT, SOAP, etc.), registrar también en VehiculoDocumento
          const TIPOS_DOCUMENTO = ['REVISION_TECNICA', 'PERMISO_CIRCULACION', 'SOAP', 'SEGURO_VOLUNTARIO']
          if (TIPOS_DOCUMENTO.includes(tipoMantencion) && proxFecha) {
            // Desactivar el documento anterior del mismo tipo
            await tx.vehiculoDocumento.updateMany({
              where: { vehiculoId, tenantId, tipo: tipoMantencion, activo: true },
              data:  { activo: false },
            })
            // Crear el nuevo documento vigente
            await tx.vehiculoDocumento.create({
              data: {
                tenantId,
                vehiculoId,
                tipo:            tipoMantencion,
                fechaEmision:    fecha ? new Date(fecha) : new Date(),
                fechaVencimiento: new Date(proxFecha),
                numeroDocumento: numeroFolio || null,
                monto:           costo || null,
                proveedor:       taller || null,
                activo:          true,
              },
            })
          }
          break
        }

        // —— TRASLADO ——
        case 'TRASLADO': {
          const { destino, motivo, kmSalida, kmLlegada } = detalleRaw
          if (!destino) throw new Error('destino es obligatorio para TRASLADO')

          await tx.trasladoRegistro.create({
            data: {
              actividadId: actividad.id,
              destino,
              motivo:    motivo    || null,
              kmSalida:  kmSalida  || null,
              kmLlegada: kmLlegada || null,
            },
          })

          // Si viene kmLlegada y es mayor al odómetro actual, actualizar
          if (kmLlegada && kmLlegada > vehiculo.odometroActual) {
            await tx.flotaVehiculo.update({
              where: { id: vehiculoId },
              data:  { odometroActual: kmLlegada },
            })
          }
          break
        }

        // —— CAMBIO DE ESTADO ——
        case 'CAMBIO_ESTADO': {
          const { estadoNuevo, motivo, tallerNombre, fechaRetornoEstimada,
                  conductorAsignadoId } = detalleRaw
          if (!estadoNuevo) throw new Error('estadoNuevo es obligatorio para CAMBIO_ESTADO')

          await tx.estadoCambioFlota.create({
            data: {
              actividadId:          actividad.id,
              vehiculoId,
              estadoAnterior:       vehiculo.estado,
              estadoNuevo,
              motivo:               motivo || null,
              tallerNombre:         tallerNombre || null,
              fechaRetornoEstimada: fechaRetornoEstimada ? new Date(fechaRetornoEstimada) : null,
              conductorAsignadoId:  conductorAsignadoId || null,
            },
          })
          // Actualizar estado y conductor del vehículo
          await tx.flotaVehiculo.update({
            where: { id: vehiculoId },
            data: {
              estado: estadoNuevo,
              ...(conductorAsignadoId !== undefined && { conductorId: conductorAsignadoId || null }),
            },
          })
          break
        }
      }

      return actividad
    })

    res.status(201).json({ id: resultado.id, tipo, vehiculoId })
  } catch (err) {
    if (err.message.includes('odómetro') || err.message.includes('obligatorio')) {
      return res.status(400).json({ error: err.message })
    }
    console.error(err)
    res.status(500).json({ error: 'Error al registrar actividad' })
  }
})

// ——— DELETE /api/flota/actividades/:id ————————————————————————
router.delete('/:id', async (req, res) => {
  try {
    const { tenantId } = req.user
    const { id } = req.params

    // Verificar que la actividad pertenece al tenant
    const actividad = await prisma.flotaActividad.findFirst({
      where: { id, tenantId },
      select: { id: true, tipo: true }
    })
    if (!actividad) return res.status(404).json({ error: 'Actividad no encontrada' })

    // No permitir eliminar CAMBIO_ESTADO (afecta estado del vehículo)
    if (actividad.tipo === 'CAMBIO_ESTADO') {
      return res.status(400).json({ error: 'No se puede eliminar un cambio de estado' })
    }

    await prisma.flotaActividad.delete({ where: { id } })

    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al eliminar actividad' })
  }
})

module.exports = router
