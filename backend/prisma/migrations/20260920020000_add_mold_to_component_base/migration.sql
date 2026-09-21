ALTER TABLE "ComponenteBase" ADD COLUMN "moldeMateriaPrimaId" INTEGER;

CREATE INDEX "ComponenteBase_moldeMateriaPrimaId_idx" ON "ComponenteBase"("moldeMateriaPrimaId");

ALTER TABLE "ComponenteBase"
  ADD CONSTRAINT "ComponenteBase_moldeMateriaPrimaId_fkey"
  FOREIGN KEY ("moldeMateriaPrimaId") REFERENCES "MateriaPrima"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
