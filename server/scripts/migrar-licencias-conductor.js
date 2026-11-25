// scripts/migrar-licencias-conductor.js
// Mueve licenciaCategoria / licenciaVence / licenciaNumero de cada Conductor
// al nuevo modelo ConductorDocumento tipo LICENCIA_CONDUCIR.
//
// Uso: node server/scripts/migrar-licencias-conductor.js
// Es idempotente: no crea duplicados si ya existe un doc de licencia para ese conductor.

const { PrismaClient } = require('@prisma/client')
const { randomBytes }  = require('crypto')

const prisma = new PrismaClient()

function cuid() {
  // cuid simplificado — suficiente para IDs únicos en este script
  return 'c' + randomBytes(16).toString('hex')
}

async function main() {
  const conductores = await prisma.conductor.findMany({
    where: {
      OR: [
        { licenciaCategoria: { not: null } },
        { licenciaVence:     { not: null } },
        { licenciaNumero:    { not: null } },
      ],
    },
    select: {
      id: true,
      tenantId: true,
      nombre: true,
      licenciaCategoria: true,
      licenciaVence: true,
      licenciaNumero: true,
      documentos: {
        where: { tipo: 'LICENCIA_CONDUCIR', activo: true },
        select: { id: true },
      },
    },
  })

  console.log(`Conductores con datos de licencia: ${conductores.length}`)

  let creados  = 0
  let saltados = 0

  for (const c of conductores) {
    if (c.documentos.length > 0) {
      console.log(`  SKIP ${c.nombre} — ya tiene ${c.documentos.length} doc(s) de licencia`)
      saltados++
      continue
    }

    await prisma.conductorDocumento.create({
      data: {
        id:               cuid(),
        tenantId:         c.tenantId,
        conductorId:      c.id,
        tipo:             'LICENCIA_CONDUCIR',
        categoria:        c.licenciaCategoria || null,
        fechaVencimiento: c.licenciaVence     || null,
        numeroDocumento:  c.licenciaNumero    || null,
        activo:           true,
      },
    })

    console.log(`  OK  ${c.nombre} — categoría: ${c.licenciaCategoria ?? '—'}, vence: ${c.licenciaVence?.toISOString().slice(0,10) ?? '—'}`)
    creados++
  }

  console.log(`\nResumen: ${creados} migrados, ${saltados} saltados (ya tenían documento).`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
