-- Migración: agregar región y unidad operativa a FlotaVehiculo
ALTER TABLE "FlotaVehiculo" ADD COLUMN IF NOT EXISTS "region" TEXT;
ALTER TABLE "FlotaVehiculo" ADD COLUMN IF NOT EXISTS "unidadOperativa" TEXT;
