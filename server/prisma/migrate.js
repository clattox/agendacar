/**
 * Script de migración manual para AgendaCar.
 * Ejecutar en Render con: node prisma/migrate.js
 *
 * Todas las sentencias son idempotentes (IF NOT EXISTS / IF NOT EXISTS).
 * Se puede correr más de una vez sin problemas.
 */
require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main () {
  console.log('[migrate] Iniciando migraciones pendientes...')

  // ── Migración: add_capacidad_y_slots ────────────────────────────────────────
  console.log('[migrate] add_capacidad_y_slots...')

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Tenant"
      ADD COLUMN IF NOT EXISTS "capacidad" INTEGER NOT NULL DEFAULT 1
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SlotDisponible" (
      "id"        SERIAL PRIMARY KEY,
      "diaSemana" INTEGER NOT NULL,
      "hora"      TEXT    NOT NULL,
      "tenantId"  INTEGER NOT NULL,
      CONSTRAINT "SlotDisponible_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "SlotDisponible_tenantId_diaSemana_hora_key"
      ON "SlotDisponible"("tenantId", "diaSemana", "hora")
  `)

  // ── Migración: add_direccion_tenant ─────────────────────────────────────────
  console.log('[migrate] add_direccion_tenant...')

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Tenant"
      ADD COLUMN IF NOT EXISTS "direccion" TEXT
  `)

  // ────────────────────────────────────────────────────────────────────────────
  console.log('[migrate] ✓ Todas las migraciones aplicadas correctamente.')
}

main()
  .catch(err => {
    console.error('[migrate] ✗ Error:', err.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
