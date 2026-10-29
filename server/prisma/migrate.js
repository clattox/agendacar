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
      ADD COLUMN IF NOT EXISTS "inspeccionActiva" BOOLEAN NOT NULL DEFAULT true
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

  // ── Migración: add_trabajadores ─────────────────────────────────────────────
  console.log('[migrate] add_trabajadores...')

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Trabajador" (
      "id"        SERIAL PRIMARY KEY,
      "nombre"    TEXT    NOT NULL,
      "cargo"     TEXT,
      "activo"    BOOLEAN NOT NULL DEFAULT true,
      "tenantId"  INTEGER NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT "Trabajador_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `)

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Inspeccion"
      ADD COLUMN IF NOT EXISTS "trabajadorId" INTEGER
  `)

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Inspeccion_trabajadorId_fkey'
      ) THEN
        ALTER TABLE "Inspeccion"
          ADD CONSTRAINT "Inspeccion_trabajadorId_fkey"
          FOREIGN KEY ("trabajadorId") REFERENCES "Trabajador"("id")
          ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END $$;
  `)

  // ── Migración: reserva_trabajadores (many-to-many) ──────────────────────────
  console.log('[migrate] reserva_trabajadores...')

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "_ReservaTrabajador" (
      "A" INTEGER NOT NULL,
      "B" INTEGER NOT NULL,
      CONSTRAINT "_ReservaTrabajador_A_fkey"
        FOREIGN KEY ("A") REFERENCES "Reserva"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "_ReservaTrabajador_B_fkey"
        FOREIGN KEY ("B") REFERENCES "Trabajador"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "_ReservaTrabajador_AB_unique"
      ON "_ReservaTrabajador"("A", "B")
  `)

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "_ReservaTrabajador_B_index"
      ON "_ReservaTrabajador"("B")
  `)

  // ── Migración: catalogo_vehiculos ────────────────────────────────────────────
  console.log('[migrate] catalogo_vehiculos...')

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CatalogoVehiculo" (
      "id"       SERIAL       NOT NULL,
      "marca"    TEXT         NOT NULL,
      "modelo"   TEXT         NOT NULL DEFAULT '',
      "tenantId" INTEGER      NOT NULL,
      CONSTRAINT "CatalogoVehiculo_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "CatalogoVehiculo_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "CatalogoVehiculo_marca_modelo_tenantId_key"
      ON "CatalogoVehiculo"("marca", "modelo", "tenantId")
  `)

  // ── Migración: cierre_atencion ───────────────────────────────────────────────
  console.log('[migrate] cierre_atencion...')

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CierreAtencion" (
      "id"        SERIAL       NOT NULL,
      "reservaId" INTEGER      NOT NULL,
      "tenantId"  INTEGER      NOT NULL,
      "notas"     TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CierreAtencion_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "CierreAtencion_reservaId_fkey"
        FOREIGN KEY ("reservaId") REFERENCES "Reserva"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "CierreAtencion_reservaId_key"
      ON "CierreAtencion"("reservaId")
  `)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ItemCierre" (
      "id"          SERIAL       NOT NULL,
      "cierreId"    INTEGER      NOT NULL,
      "descripcion" TEXT         NOT NULL,
      "valor"       DOUBLE PRECISION NOT NULL DEFAULT 0,
      CONSTRAINT "ItemCierre_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "ItemCierre_cierreId_fkey"
        FOREIGN KEY ("cierreId") REFERENCES "CierreAtencion"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)

  // ── Migración: cotizacion ────────────────────────────────────────────────────
  console.log('[migrate] cotizacion...')

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Cotizacion" (
      "id"        SERIAL       NOT NULL,
      "reservaId" INTEGER      NOT NULL,
      "tenantId"  INTEGER      NOT NULL,
      "notas"     TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Cotizacion_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "Cotizacion_reservaId_fkey"
        FOREIGN KEY ("reservaId") REFERENCES "Reserva"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Cotizacion_reservaId_key"
      ON "Cotizacion"("reservaId")
  `)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ItemCotizacion" (
      "id"           SERIAL           NOT NULL,
      "cotizacionId" INTEGER          NOT NULL,
      "descripcion"  TEXT             NOT NULL,
      "valor"        DOUBLE PRECISION NOT NULL DEFAULT 0,
      CONSTRAINT "ItemCotizacion_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "ItemCotizacion_cotizacionId_fkey"
        FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)

  // ── Recordatorio diario ───────────────────────────────────────────────────
  console.log('[migrate] recordatorio_tenant...')
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Tenant"
    ADD COLUMN IF NOT EXISTS "recordatorioActivo" BOOLEAN NOT NULL DEFAULT false
  `)
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Tenant"
    ADD COLUMN IF NOT EXISTS "recordatorioHora" INTEGER NOT NULL DEFAULT 20
  `)
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Tenant"
    ADD COLUMN IF NOT EXISTS "recordatorioDias" TEXT NOT NULL DEFAULT '1,2,3,4,5'
  `)

// ────────────────────────────────────────────────────────────────────────────
  console.log('[migrate] ✓ Todas las migraciones aplicadas correctamente.')
}

// Permite correr directo (node prisma/migrate.js) o importar desde index.js
if (require.main === module) {
  main()
    .catch(err => {
      console.error('[migrate] ✗ Error:', err.message)
      process.exit(1)
    })
    .finally(() => prisma.$disconnect())
}

module.exports = main
