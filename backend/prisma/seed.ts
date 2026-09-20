import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL || 'postgresql://velas_user:velas_password@localhost:5433/velas_db?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Sembrando base de datos...');

  // 1. Crear usuarios de ejemplo
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.usuario.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      nombre: 'Administrador Velas',
      rol: 'ADMIN',
    },
  });

  const operativePassword = await bcrypt.hash('operative123', 10);
  const operative = await prisma.usuario.upsert({
    where: { username: 'operative' },
    update: {},
    create: {
      username: 'operative',
      password: operativePassword,
      nombre: 'Operador Logístico',
      rol: 'OPERATIVO',
    },
  });

  console.log('Usuarios creados:', { admin: admin.username, operative: operative.username });

  // 2. Crear Materia Prima
  const cera = await prisma.materiaPrima.upsert({
    where: { nombre: 'Cera de Soya Premium' },
    update: { tipo: 'CERA', stockMinimo: 2000 },
    create: {
      nombre: 'Cera de Soya Premium',
      tipo: 'CERA',
      unidadMedida: 'GR',
      costoUnitario: 0.05, // Costo por gramo
      stockActual: 15000, // 15kg
      stockMinimo: 2000,
    },
  });

  const esencia = await prisma.materiaPrima.upsert({
    where: { nombre: 'Esencia Dulce Vainilla' },
    update: { tipo: 'ESENCIA', stockMinimo: 200 },
    create: {
      nombre: 'Esencia Dulce Vainilla',
      tipo: 'ESENCIA',
      unidadMedida: 'ML',
      costoUnitario: 0.8, // Costo por ml
      stockActual: 1000, // 1000ml
      stockMinimo: 200,
    },
  });

  // Esencias compatibles para probar las variantes de un mismo componente.
  // Todas usan ML, igual que la esencia de referencia de las recetas semilla.
  await prisma.materiaPrima.upsert({
    where: { nombre: 'Esencia de Chocolate' },
    update: { tipo: 'ESENCIA', stockMinimo: 200 },
    create: {
      nombre: 'Esencia de Chocolate',
      tipo: 'ESENCIA',
      unidadMedida: 'ML',
      costoUnitario: 0.85,
      stockActual: 1000,
      stockMinimo: 200,
    },
  });

  await prisma.materiaPrima.upsert({
    where: { nombre: 'Esencia de Lavanda' },
    update: { tipo: 'ESENCIA', stockMinimo: 200 },
    create: {
      nombre: 'Esencia de Lavanda',
      tipo: 'ESENCIA',
      unidadMedida: 'ML',
      costoUnitario: 0.9,
      stockActual: 1000,
      stockMinimo: 200,
    },
  });

  await prisma.materiaPrima.upsert({
    where: { nombre: 'Esencia de Coco' },
    update: { tipo: 'ESENCIA', stockMinimo: 200 },
    create: {
      nombre: 'Esencia de Coco',
      tipo: 'ESENCIA',
      unidadMedida: 'ML',
      costoUnitario: 0.88,
      stockActual: 1000,
      stockMinimo: 200,
    },
  });

  const pabilo = await prisma.materiaPrima.upsert({
    where: { nombre: 'Pabilo de Algodón 15cm' },
    update: { tipo: 'PABILO', stockMinimo: 20 },
    create: {
      nombre: 'Pabilo de Algodón 15cm',
      tipo: 'PABILO',
      unidadMedida: 'UNIDAD',
      costoUnitario: 0.15,
      stockActual: 200,
      stockMinimo: 20,
    },
  });

  const envase = await prisma.materiaPrima.upsert({
    where: { nombre: 'Envase de Vidrio 8oz' },
    update: { tipo: 'INSUMO_GENERAL', stockMinimo: 15 },
    create: {
      nombre: 'Envase de Vidrio 8oz',
      tipo: 'INSUMO_GENERAL',
      unidadMedida: 'UNIDAD',
      costoUnitario: 1.5,
      stockActual: 100,
      stockMinimo: 15,
    },
  });

  console.log('Materia Prima creada');

  // 3. Crear Componentes Base
  const osoCuerpo = await prisma.componenteBase.upsert({
    where: { nombre: 'Cuerpo de Oso Cera Neutra' },
    update: {
      pesoAgua: 136.67,
      tipoVela: 'DECORATIVA',
      porcentajeEsencia: 2.44,
    },
    create: {
      nombre: 'Cuerpo de Oso Cera Neutra',
      costoProduccion: (120 * 0.05) + (3 * 0.8), // 120g cera + 3ml esencia = 6 + 2.4 = 8.4
      stockDisponible: 50,
      pesoAgua: 136.67,
      tipoVela: 'DECORATIVA',
      porcentajeEsencia: 2.44,
    },
  });

  await prisma.recetaComponente.upsert({
    where: {
      componenteBaseId_materiaPrimaId: {
        componenteBaseId: osoCuerpo.id,
        materiaPrimaId: cera.id,
      },
    },
    update: {},
    create: {
      componenteBaseId: osoCuerpo.id,
      materiaPrimaId: cera.id,
      cantidadNecesaria: 120,
    },
  });

  await prisma.recetaComponente.upsert({
    where: {
      componenteBaseId_materiaPrimaId: {
        componenteBaseId: osoCuerpo.id,
        materiaPrimaId: esencia.id,
      },
    },
    update: {},
    create: {
      componenteBaseId: osoCuerpo.id,
      materiaPrimaId: esencia.id,
      cantidadNecesaria: 3,
    },
  });

  const vasoRelleno = await prisma.componenteBase.upsert({
    where: { nombre: 'Envase 8oz con Cera Vainilla' },
    update: {
      pesoAgua: 205.56,
      tipoVela: 'AROMATICA',
      porcentajeEsencia: 2.7,
    },
    create: {
      nombre: 'Envase 8oz con Cera Vainilla',
      costoProduccion: 1.5 + (180 * 0.05) + (5 * 0.8), // 1.5 envase + 9 cera + 4 esencia = 14.5
      stockDisponible: 30,
      pesoAgua: 205.56,
      tipoVela: 'AROMATICA',
      porcentajeEsencia: 2.7,
    },
  });

  await prisma.recetaComponente.upsert({
    where: {
      componenteBaseId_materiaPrimaId: {
        componenteBaseId: vasoRelleno.id,
        materiaPrimaId: envase.id,
      },
    },
    update: {},
    create: {
      componenteBaseId: vasoRelleno.id,
      materiaPrimaId: envase.id,
      cantidadNecesaria: 1,
    },
  });

  await prisma.recetaComponente.upsert({
    where: {
      componenteBaseId_materiaPrimaId: {
        componenteBaseId: vasoRelleno.id,
        materiaPrimaId: cera.id,
      },
    },
    update: {},
    create: {
      componenteBaseId: vasoRelleno.id,
      materiaPrimaId: cera.id,
      cantidadNecesaria: 180,
    },
  });

  await prisma.recetaComponente.upsert({
    where: {
      componenteBaseId_materiaPrimaId: {
        componenteBaseId: vasoRelleno.id,
        materiaPrimaId: esencia.id,
      },
    },
    update: {},
    create: {
      componenteBaseId: vasoRelleno.id,
      materiaPrimaId: esencia.id,
      cantidadNecesaria: 5,
    },
  });

  // Cada componente con esencia de referencia necesita su variante inicial para
  // que pueda seleccionarse y fabricarse desde Componentes Base.
  await prisma.componenteVariante.upsert({
    where: {
      componenteBaseId_esenciaId: {
        componenteBaseId: osoCuerpo.id,
        esenciaId: esencia.id,
      },
    },
    update: {},
    create: {
      componenteBaseId: osoCuerpo.id,
      esenciaId: esencia.id,
      stockDisponible: osoCuerpo.stockDisponible,
    },
  });

  await prisma.componenteVariante.upsert({
    where: {
      componenteBaseId_esenciaId: {
        componenteBaseId: vasoRelleno.id,
        esenciaId: esencia.id,
      },
    },
    update: {},
    create: {
      componenteBaseId: vasoRelleno.id,
      esenciaId: esencia.id,
      stockDisponible: vasoRelleno.stockDisponible,
    },
  });

  console.log('Componentes Base y Recetas creados');

  // 4. Crear Catálogo de Productos
  const velaOso = await prisma.catalogoProducto.upsert({
    where: { nombre: 'Vela Escultórica Oso de Peluche' },
    update: {},
    create: {
      nombre: 'Vela Escultórica Oso de Peluche',
      precioVenta: 25.0,
      requiereEnsamble: true,
      imagenUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=400',
    },
  });

  await prisma.estructuraEnsamble.upsert({
    where: {
      catalogoProductoId_componenteBaseId: {
        catalogoProductoId: velaOso.id,
        componenteBaseId: osoCuerpo.id,
      },
    },
    update: {},
    create: {
      catalogoProductoId: velaOso.id,
      componenteBaseId: osoCuerpo.id,
      cantidadNecesaria: 1,
    },
  });

  const velaOsoVaso = await prisma.catalogoProducto.upsert({
    where: { nombre: 'Vela en Envase con Decoración Oso' },
    update: {},
    create: {
      nombre: 'Vela en Envase con Decoración Oso',
      precioVenta: 45.0,
      requiereEnsamble: true,
      imagenUrl: 'https://images.unsplash.com/photo-1596435707261-0f40cbcf24a3?auto=format&fit=crop&q=80&w=400',
    },
  });

  await prisma.estructuraEnsamble.upsert({
    where: {
      catalogoProductoId_componenteBaseId: {
        catalogoProductoId: velaOsoVaso.id,
        componenteBaseId: vasoRelleno.id,
      },
    },
    update: {},
    create: {
      catalogoProductoId: velaOsoVaso.id,
      componenteBaseId: vasoRelleno.id,
      cantidadNecesaria: 1,
    },
  });

  await prisma.estructuraEnsamble.upsert({
    where: {
      catalogoProductoId_componenteBaseId: {
        catalogoProductoId: velaOsoVaso.id,
        componenteBaseId: osoCuerpo.id,
      },
    },
    update: {},
    create: {
      catalogoProductoId: velaOsoVaso.id,
      componenteBaseId: osoCuerpo.id,
      cantidadNecesaria: 1,
    },
  });

  console.log('Productos de catálogo creados con sus ensamles');
  console.log('¡Base de datos sembrada con éxito!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
