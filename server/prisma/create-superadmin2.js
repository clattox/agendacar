/**
 * Crea (o actualiza) un segundo superadmin en la base de datos.
 * Uso:  node server/prisma/create-superadmin2.js
 * Requiere DATABASE_URL en el entorno o en server/.env
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const EMAIL    = 'gonpec@gmail.com'
const NOMBRE   = 'Superadmin 2'
const PASSWORD = 'yyFJ2MrEabzzvikH' // cambiar tras primer acceso

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10)

  const usuario = await prisma.usuario.upsert({
    where: { email: EMAIL },
    update: { password: hash, rol: 'superadmin', tenantId: null },
    create: {
      nombre: NOMBRE,
      email: EMAIL,
      password: hash,
      rol: 'superadmin',
      tenantId: null
    }
  })

  console.log('─────────────────────────────────────────')
  console.log(`✓ Superadmin creado / actualizado`)
  console.log(`  Email:       ${EMAIL}`)
  console.log(`  Contraseña:  ${PASSWORD}`)
  console.log(`  ID:          ${usuario.id}`)
  console.log('─────────────────────────────────────────')
  console.log('⚠  Cambia la contraseña después del primer acceso.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
