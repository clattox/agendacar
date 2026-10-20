const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando seed Ewert...')

  const tenant = await prisma.tenant.upsert({
    where: { subdominio: 'ewert' },
    update: { nombre: 'Servicio Automotriz Ewert', email: 'ewert@agendacar.cl', telefono: '+56912345678' },
    create: { nombre: 'Servicio Automotriz Ewert', subdominio: 'ewert', email: 'ewert@agendacar.cl', telefono: '+56912345678' }
  })
  console.log(`Tenant: ${tenant.nombre} (id: ${tenant.id})`)

  const hash = await bcrypt.hash('ewert2024', 10)
  await prisma.usuario.upsert({
    where: { email: 'admin@ewert.cl' },
    update: { password: hash },
    create: { nombre: 'Administrador Ewert', email: 'admin@ewert.cl', password: hash, rol: 'admin', tenantId: tenant.id }
  })
  console.log('Usuario: admin@ewert.cl / ewert2024')

  await prisma.servicio.deleteMany({ where: { tenantId: tenant.id } })
  await prisma.horario.deleteMany({ where: { tenantId: tenant.id } })

  for (const s of [
    { nombre: 'Cambio de aceite y filtro', duracion: 30 },
    { nombre: 'Revisión general', duracion: 60 },
    { nombre: 'Frenos (revisión y cambio)', duracion: 45 },
    { nombre: 'Neumáticos (montaje y desmontaje)', duracion: 30 },
    { nombre: 'Alineación y balanceo', duracion: 45 },
    { nombre: 'Diagnóstico computarizado', duracion: 30 },
  ]) await prisma.servicio.create({ data: { ...s, tenantId: tenant.id } })
  console.log('6 servicios creados')

  for (const h of [
    { diaSemana: 1, horaInicio: '08:30', horaFin: '18:00', activo: true },
    { diaSemana: 2, horaInicio: '08:30', horaFin: '18:00', activo: true },
    { diaSemana: 3, horaInicio: '08:30', horaFin: '18:00', activo: true },
    { diaSemana: 4, horaInicio: '08:30', horaFin: '18:00', activo: true },
    { diaSemana: 5, horaInicio: '08:30', horaFin: '18:00', activo: true },
    { diaSemana: 6, horaInicio: '09:00', horaFin: '13:00', activo: true },
  ]) await prisma.horario.create({ data: { ...h, tenantId: tenant.id } })
  console.log('6 horarios creados')

  console.log('\n✓ Listo! Admin: admin@ewert.cl / ewert2024')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
