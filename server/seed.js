const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creando tenant demo...');

  const tenant = await prisma.tenant.upsert({
    where: { subdominio: 'demo' },
    update: {},
    create: {
      nombre: 'Serviteca Demo',
      subdominio: 'demo',
      email: 'demo@agendacar.cl',
      telefono: '+56912345678',
      activo: true,
    },
  });
  console.log(`✅ Tenant creado: ${tenant.nombre} (subdominio: ${tenant.subdominio})`);

  const hash = await bcrypt.hash('demo1234', 10);
  const usuario = await prisma.usuario.upsert({
    where: { email: 'admin@demo.cl' },
    update: {},
    create: {
      nombre: 'Admin Demo',
      email: 'admin@demo.cl',
      password: hash,
      rol: 'admin',
      tenantId: tenant.id,
    },
  });
  console.log(`✅ Usuario creado: ${usuario.email} / demo1234`);

  const servicios = [
    { nombre: 'Cambio de aceite', duracion: 30 },
    { nombre: 'Alineación y balanceo', duracion: 60 },
    { nombre: 'Revisión general', duracion: 90 },
    { nombre: 'Cambio de frenos', duracion: 45 },
  ];

  for (const s of servicios) {
    const existing = await prisma.servicio.findFirst({ where: { nombre: s.nombre, tenantId: tenant.id } });
    if (!existing) await prisma.servicio.create({ data: { ...s, tenantId: tenant.id } });
  }
  console.log(`✅ ${servicios.length} servicios creados`);

  await prisma.horario.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.horario.createMany({
    data: [
      { diaSemana: 1, horaInicio: '09:00', horaFin: '18:00', tenantId: tenant.id },
      { diaSemana: 2, horaInicio: '09:00', horaFin: '18:00', tenantId: tenant.id },
      { diaSemana: 3, horaInicio: '09:00', horaFin: '18:00', tenantId: tenant.id },
      { diaSemana: 4, horaInicio: '09:00', horaFin: '18:00', tenantId: tenant.id },
      { diaSemana: 5, horaInicio: '09:00', horaFin: '18:00', tenantId: tenant.id },
      { diaSemana: 6, horaInicio: '09:00', horaFin: '13:00', tenantId: tenant.id },
    ],
  });
  console.log('✅ Horarios creados');

  console.log('\n🎉 Seed completado!');
  console.log('   Login admin: admin@demo.cl / demo1234');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
