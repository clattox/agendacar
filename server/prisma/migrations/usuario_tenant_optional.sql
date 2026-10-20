-- Migración: tenantId opcional en Usuario (para superadmin sin tenant)
ALTER TABLE "Usuario" ALTER COLUMN "tenantId" DROP NOT NULL;
