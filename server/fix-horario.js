const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
p.horario.findMany().then(h => {
  h.forEach(x => console.log(`id:${x.id} dia:${x.diaSemana} inicio:${x.horaInicio} fin:${x.horaFin} tenant:${x.tenantId}`))
}).finally(() => p.$disconnect())
