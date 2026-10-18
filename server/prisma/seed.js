const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando seed...')

  // ─── Crear tenant ───────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { subdominio: 'demo' },
    update: {},
    create: {
      nombre: 'Serviteca Demo',
      subdominio: 'demo',
      email: 'demo@agendacar.cl',
      telefono: '+56 9 1234 5678',
    }
  })
  console.log(`Tenant creado: ${tenant.nombre} (subdominio: ${tenant.subdominio})`)

  // ─── Crear usuario admin ─────────────────────────────────────
  const hash = await bcrypt.hash('admin1234', 10)
  const usuario = await prisma.usuario.upsert({
    where: { email: 'admin@demo.cl' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@demo.cl',
      password: hash,
      rol: 'admin',
      tenantId: tenant.id,
    }
  })
  console.log(`Usuario admin: ${usuario.email} / contraseña: admin1234`)

  // ─── Servicios ───────────────────────────────────────────────
  const servicios = [
    { nombre: 'Cambio de aceite', duracion: 30 },
    { nombre: 'Revisión general', duracion: 60 },
    { nombre: 'Frenos', duracion: 45 },
    { nombre: 'Neumáticos', duracion: 30 },
    { nombre: 'Alineación y balanceo', duracion: 45 },
  ]

  for (const s of servicios) {
    await prisma.servicio.create({ data: { ...s, tenantId: tenant.id } })
  }
  console.log(`${servicios.length} servicios creados`)

  // ─── Horarios (Lunes a Viernes 9:00–18:00, Sábado 9:00–13:00) ──
  const horarios = [
    { diaSemana: 1, horaInicio: '09:00', horaFin: '18:00', activo: true }, // Lunes
    { diaSemana: 2, horaInicio: '09:00', horaFin: '18:00', activo: true }, // Martes
    { diaSemana: 3, horaInicio: '09:00', horaFin: '18:00', activo: true }, // Miércoles
    { diaSemana: 4, horaInicio: '09:00', horaFin: '18:00', activo: true }, // Jueves
    { diaSemana: 5, horaInicio: '09:00', horaFin: '18:00', activo: true }, // Viernes
    { diaSemana: 6, horaInicio: '09:00', horaFin: '13:00', activo: true }, // Sábado
  ]

  for (const h of horarios) {
    await prisma.horario.create({ data: { ...h, tenantId: tenant.id } })
  }
  console.log(`${horarios.length} horarios creados`)

  console.log('\n✓ Seed completado')
  console.log('─────────────────────────────────')
  console.log(`  URL pública:  http://demo.tudominio.cl`)
  console.log(`  Admin:        http://demo.tudominio.cl/admin/login`)
  console.log(`  Email:        admin@demo.cl`)
  console.log(`  Contraseña:   admin1234`)
  console.log('─────────────────────────────────')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
