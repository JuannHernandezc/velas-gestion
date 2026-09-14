-- DropIndex
DROP INDEX "DetallePedido_pedidoId_catalogoProductoId_key";

-- AlterTable
ALTER TABLE "DetallePedido" ADD COLUMN     "descripcionVariante" TEXT,
ADD COLUMN     "varianteId" INTEGER;

-- CreateTable
CREATE TABLE "ComponenteVariante" (
    "id" SERIAL NOT NULL,
    "componenteBaseId" INTEGER NOT NULL,
    "esenciaId" INTEGER NOT NULL,
    "stockDisponible" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "ComponenteVariante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogoVariante" (
    "id" SERIAL NOT NULL,
    "catalogoProductoId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "precioVenta" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "CatalogoVariante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeleccionVariante" (
    "id" SERIAL NOT NULL,
    "catalogoVarianteId" INTEGER NOT NULL,
    "componenteVarianteId" INTEGER NOT NULL,

    CONSTRAINT "SeleccionVariante_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ComponenteVariante_componenteBaseId_esenciaId_key" ON "ComponenteVariante"("componenteBaseId", "esenciaId");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogoVariante_catalogoProductoId_nombre_key" ON "CatalogoVariante"("catalogoProductoId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "SeleccionVariante_catalogoVarianteId_componenteVarianteId_key" ON "SeleccionVariante"("catalogoVarianteId", "componenteVarianteId");

-- CreateIndex
CREATE INDEX "DetallePedido_pedidoId_catalogoProductoId_idx" ON "DetallePedido"("pedidoId", "catalogoProductoId");

-- AddForeignKey
ALTER TABLE "DetallePedido" ADD CONSTRAINT "DetallePedido_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "CatalogoVariante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponenteVariante" ADD CONSTRAINT "ComponenteVariante_componenteBaseId_fkey" FOREIGN KEY ("componenteBaseId") REFERENCES "ComponenteBase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponenteVariante" ADD CONSTRAINT "ComponenteVariante_esenciaId_fkey" FOREIGN KEY ("esenciaId") REFERENCES "MateriaPrima"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogoVariante" ADD CONSTRAINT "CatalogoVariante_catalogoProductoId_fkey" FOREIGN KEY ("catalogoProductoId") REFERENCES "CatalogoProducto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeleccionVariante" ADD CONSTRAINT "SeleccionVariante_catalogoVarianteId_fkey" FOREIGN KEY ("catalogoVarianteId") REFERENCES "CatalogoVariante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeleccionVariante" ADD CONSTRAINT "SeleccionVariante_componenteVarianteId_fkey" FOREIGN KEY ("componenteVarianteId") REFERENCES "ComponenteVariante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Conservar el aroma y las existencias de recetas con una sola esencia.
INSERT INTO "ComponenteVariante" ("componenteBaseId", "esenciaId", "stockDisponible")
SELECT c.id, MIN(r."materiaPrimaId"), c."stockDisponible"
FROM "ComponenteBase" c JOIN "RecetaComponente" r ON r."componenteBaseId" = c.id
JOIN "MateriaPrima" m ON m.id = r."materiaPrimaId" AND m.tipo = 'ESENCIA'
GROUP BY c.id HAVING COUNT(*) = 1;

INSERT INTO "CatalogoVariante" ("catalogoProductoId", nombre, "precioVenta")
SELECT p.id, 'Original', p."precioVenta" FROM "CatalogoProducto" p
WHERE p."requiereEnsamble" AND EXISTS (
 SELECT 1 FROM "EstructuraEnsamble" e JOIN "ComponenteVariante" v ON v."componenteBaseId" = e."componenteBaseId"
 WHERE e."catalogoProductoId" = p.id
);
INSERT INTO "SeleccionVariante" ("catalogoVarianteId", "componenteVarianteId")
SELECT cv.id, v.id FROM "CatalogoVariante" cv
JOIN "EstructuraEnsamble" e ON e."catalogoProductoId" = cv."catalogoProductoId"
JOIN "ComponenteVariante" v ON v."componenteBaseId" = e."componenteBaseId";
-- Las ventas previas conservan sus importes. No se infiere retrospectivamente su aroma.
