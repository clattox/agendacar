-- Tabla de números de cotización "libres" (huecos generados al eliminar una cotización).
-- Al crear una nueva cotización, primero se consume el hueco menor disponible.

CREATE TABLE IF NOT EXISTS "NumeroCotizacionLibre" (
  "id"       SERIAL PRIMARY KEY,
  "tenantId" INTEGER NOT NULL,
  "numero"   INTEGER NOT NULL,
  CONSTRAINT "NumeroCotizacionLibre_tenantId_numero_key" UNIQUE ("tenantId", "numero")
);

CREATE INDEX IF NOT EXISTS "NumeroCotizacionLibre_tenantId_idx"
  ON "NumeroCotizacionLibre" ("tenantId");
