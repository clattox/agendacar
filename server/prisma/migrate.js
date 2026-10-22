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

  // ── Migración: modulo_inspeccion ─────────────────────────────────────────────
  console.log('[migrate] modulo_inspeccion...')

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Tenant"
      ADD COLUMN IF NOT EXISTS "inspeccionActiva" BOOLEAN NOT NULL DEFAULT false
  `)

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Servicio"
      ADD COLUMN IF NOT EXISTS "requiereInspeccion" BOOLEAN NOT NULL DEFAULT false
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Inspeccion" (
      "id"                SERIAL PRIMARY KEY,
      "reservaId"         INTEGER NOT NULL UNIQUE,
      "tenantId"          INTEGER NOT NULL,
      "realizadaPorId"    INTEGER,
      "observaciones"     TEXT,
      "clienteConfirmo"   BOOLEAN NOT NULL DEFAULT false,
      "fechaConfirmacion" TIMESTAMPTZ,
      "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT "Inspeccion_reservaId_fkey"
        FOREIGN KEY ("reservaId") REFERENCES "Reserva"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Inspeccion_realizadaPorId_fkey"
        FOREIGN KEY ("realizadaPorId") REFERENCES "Usuario"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "DanoInspeccion" (
      "id"           SERIAL PRIMARY KEY,
      "inspeccionId" INTEGER NOT NULL,
      "tipo"         TEXT NOT NULL,
      "vista"        TEXT NOT NULL,
      "posX"         FLOAT8 NOT NULL,
      "posY"         FLOAT8 NOT NULL,
      "ubicacion"    TEXT,
      "descripcion"  TEXT,
      "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT "DanoInspeccion_inspeccionId_fkey"
        FOREIGN KEY ("inspeccionId") REFERENCES "Inspeccion"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    )
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
