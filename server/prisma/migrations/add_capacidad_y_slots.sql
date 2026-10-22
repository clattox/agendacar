-- Migración: agregar capacidad a Tenant y crear tabla SlotDisponible
-- Segura para producción: solo añade columna con default y tabla nueva.

-- 1. Columna capacidad en Tenant (default 1 = comportamiento actual)
ALTER TABLE "Tenant"
  ADD COLUMN IF NOT EXISTS "capacidad" INTEGER NOT NULL DEFAULT 1;

-- 2. Tabla SlotDisponible para horas de inicio personalizadas por tenant y día
CREATE TABLE IF NOT EXISTS "SlotDisponible" (
  "id"        SERIAL PRIMARY KEY,
  "diaSemana" INTEGER NOT NULL,           -- 0=Domingo, 1=Lunes ... 6=Sábado
  "hora"      TEXT    NOT NULL,           -- "09:00"
  "tenantId"  INTEGER NOT NULL,
  CONSTRAINT "SlotDisponible_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Índice único: un tenant no puede tener la misma hora dos veces el mismo día
CREATE UNIQUE INDEX IF NOT EXISTS "SlotDisponible_tenantId_diaSemana_hora_key"
  ON "SlotDisponible"("tenantId", "diaSemana", "hora");
