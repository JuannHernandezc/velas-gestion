CREATE TABLE "EstructuraEnsambleMateriaPrima" (
    "id" SERIAL NOT NULL,
    "catalogoProductoId" INTEGER NOT NULL,
    "materiaPrimaId" INTEGER NOT NULL,
    "cantidadNecesaria" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstructuraEnsambleMateriaPrima_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EstructuraEnsambleMateriaPrima_catalogoProductoId_materiaPrimaId_key"
ON "EstructuraEnsambleMateriaPrima"("catalogoProductoId", "materiaPrimaId");

ALTER TABLE "EstructuraEnsambleMateriaPrima"
ADD CONSTRAINT "EstructuraEnsambleMateriaPrima_catalogoProductoId_fkey"
FOREIGN KEY ("catalogoProductoId") REFERENCES "CatalogoProducto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EstructuraEnsambleMateriaPrima"
ADD CONSTRAINT "EstructuraEnsambleMateriaPrima_materiaPrimaId_fkey"
FOREIGN KEY ("materiaPrimaId") REFERENCES "MateriaPrima"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
