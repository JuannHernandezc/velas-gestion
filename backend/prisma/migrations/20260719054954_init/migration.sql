-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MateriaPrima" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "unidadMedida" TEXT NOT NULL,
    "costoUnitario" DOUBLE PRECISION NOT NULL,
    "stockActual" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MateriaPrima_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComponenteBase" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "costoProduccion" DOUBLE PRECISION NOT NULL,
    "stockDisponible" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComponenteBase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecetaComponente" (
    "id" SERIAL NOT NULL,
    "componenteBaseId" INTEGER NOT NULL,
    "materiaPrimaId" INTEGER NOT NULL,
    "cantidadNecesaria" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecetaComponente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogoProducto" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "precioVenta" DOUBLE PRECISION NOT NULL,
    "requiereEnsamble" BOOLEAN NOT NULL DEFAULT false,
    "imagenUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogoProducto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstructuraEnsamble" (
    "id" SERIAL NOT NULL,
    "catalogoProductoId" INTEGER NOT NULL,
    "componenteBaseId" INTEGER NOT NULL,
    "cantidadNecesaria" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstructuraEnsamble_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" SERIAL NOT NULL,
    "cliente" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canal" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "costoTotal" DOUBLE PRECISION NOT NULL,
    "rentabilidad" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetallePedido" (
    "id" SERIAL NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "catalogoProductoId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" DOUBLE PRECISION NOT NULL,
    "costoUnitario" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DetallePedido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_username_key" ON "Usuario"("username");

-- CreateIndex
CREATE UNIQUE INDEX "MateriaPrima_nombre_key" ON "MateriaPrima"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ComponenteBase_nombre_key" ON "ComponenteBase"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "RecetaComponente_componenteBaseId_materiaPrimaId_key" ON "RecetaComponente"("componenteBaseId", "materiaPrimaId");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogoProducto_nombre_key" ON "CatalogoProducto"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "EstructuraEnsamble_catalogoProductoId_componenteBaseId_key" ON "EstructuraEnsamble"("catalogoProductoId", "componenteBaseId");

-- CreateIndex
CREATE UNIQUE INDEX "DetallePedido_pedidoId_catalogoProductoId_key" ON "DetallePedido"("pedidoId", "catalogoProductoId");

-- AddForeignKey
ALTER TABLE "RecetaComponente" ADD CONSTRAINT "RecetaComponente_componenteBaseId_fkey" FOREIGN KEY ("componenteBaseId") REFERENCES "ComponenteBase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecetaComponente" ADD CONSTRAINT "RecetaComponente_materiaPrimaId_fkey" FOREIGN KEY ("materiaPrimaId") REFERENCES "MateriaPrima"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstructuraEnsamble" ADD CONSTRAINT "EstructuraEnsamble_catalogoProductoId_fkey" FOREIGN KEY ("catalogoProductoId") REFERENCES "CatalogoProducto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstructuraEnsamble" ADD CONSTRAINT "EstructuraEnsamble_componenteBaseId_fkey" FOREIGN KEY ("componenteBaseId") REFERENCES "ComponenteBase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetallePedido" ADD CONSTRAINT "DetallePedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetallePedido" ADD CONSTRAINT "DetallePedido_catalogoProductoId_fkey" FOREIGN KEY ("catalogoProductoId") REFERENCES "CatalogoProducto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
