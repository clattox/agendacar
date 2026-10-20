-- Migración: agregar tabla Bloqueo
CREATE TABLE "Bloqueo" (
    "id"          SERIAL PRIMARY KEY,
    "fecha"       TIMESTAMP(3) NOT NULL,
    "horaInicio"  TEXT,
    "horaFin"     TEXT,
    "motivo"      TEXT,
    "tenantId"    INTEGER NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Bloqueo_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Bloqueo_tenantId_fecha_idx" ON "Bloqueo"("tenantId", "fecha");
