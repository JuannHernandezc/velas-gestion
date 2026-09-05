-- Permite registrar existencias sin configurar una alerta de stock mínimo.
-- Los valores existentes se conservan para no alterar alertas ya configuradas.
ALTER TABLE "MateriaPrima" ALTER COLUMN "stockMinimo" DROP NOT NULL;
ALTER TABLE "MateriaPrima" ALTER COLUMN "stockMinimo" DROP DEFAULT;
