-- Migration: add_traslado_actividad
-- Agrega TRASLADO al enum TipoActividad y crea la tabla TrasladoRegistro

-- 1. Agregar valor al enum
ALTER TYPE "TipoActividad" ADD VALUE IF NOT EXISTS 'TRASLADO';

-- 2. Crear tabla TrasladoRegistro
CREATE TABLE IF NOT EXISTS "TrasladoRegistro" (
  "id"          TEXT NOT NULL,
  "actividadId" TEXT NOT NULL,
  "destino"     TEXT NOT NULL,
  "motivo"      TEXT,
  "kmSalida"    INTEGER,
  "kmLlegada"   INTEGER,

  CONSTRAINT "TrasladoRegistro_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TrasladoRegistro_actividadId_key" UNIQUE ("actividadId"),
  CONSTRAINT "TrasladoRegistro_actividadId_fkey"
    FOREIGN KEY ("actividadId")
    REFERENCES "FlotaActividad"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- 3. Índice
CREATE INDEX IF NOT EXISTS "TrasladoRegistro_actividadId_idx"
  ON "TrasladoRegistro"("actividadId");
