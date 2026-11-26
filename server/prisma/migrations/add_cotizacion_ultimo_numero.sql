-- Agrega columna que registra el último número de cotización asignado históricamente.
-- Este valor nunca baja, evitando que al eliminar una cotización se reutilice su número.

ALTER TABLE "Tenant"
  ADD COLUMN IF NOT EXISTS "cotizacionUltimoNumero" INTEGER NOT NULL DEFAULT 0;

-- Inicializar con el MAX actual de cada tenant para que no haya saltos en tenants existentes
UPDATE "Tenant" t
SET "cotizacionUltimoNumero" = COALESCE(
  (SELECT MAX(c.numero) FROM "Cotizacion" c WHERE c."tenantId" = t.id),
  0
);
