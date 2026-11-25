-- Migración: padrón en TipoDocumento + nuevo modelo ConductorDocumento

-- 1. Agregar PADRON al enum TipoDocumento
ALTER TYPE "TipoDocumento" ADD VALUE IF NOT EXISTS 'PADRON';

-- 2. Crear enum TipoDocumentoConductor
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TipoDocumentoConductor') THEN
    CREATE TYPE "TipoDocumentoConductor" AS ENUM (
      'LICENCIA_CONDUCIR',
      'CEDULA_IDENTIDAD',
      'CERTIFICADO_ANTECEDENTES',
      'OTRO'
    );
  END IF;
END$$;

-- 3. Crear tabla ConductorDocumento
CREATE TABLE IF NOT EXISTS "ConductorDocumento" (
  "id"               TEXT         NOT NULL,
  "tenantId"         INTEGER      NOT NULL,
  "conductorId"      TEXT         NOT NULL,
  "tipo"             "TipoDocumentoConductor" NOT NULL,
  "fechaEmision"     TIMESTAMP(3),
  "fechaVencimiento" TIMESTAMP(3),
  "numeroDocumento"  TEXT,
  "categoria"        TEXT,
  "archivoBase64"    TEXT,
  "archivoNombre"    TEXT,
  "activo"           BOOLEAN      NOT NULL DEFAULT true,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ConductorDocumento_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ConductorDocumento_conductorId_fkey"
    FOREIGN KEY ("conductorId") REFERENCES "Conductor"("id") ON DELETE CASCADE
);

-- 4. Índices
CREATE INDEX IF NOT EXISTS "ConductorDocumento_tenantId_idx"      ON "ConductorDocumento"("tenantId");
CREATE INDEX IF NOT EXISTS "ConductorDocumento_conductorId_tipo_idx" ON "ConductorDocumento"("conductorId", "tipo");
CREATE INDEX IF NOT EXISTS "ConductorDocumento_fechaVencimiento_idx" ON "ConductorDocumento"("fechaVencimiento");
