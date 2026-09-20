import { componenteInclude, presentarComponente, recetaParaEsencia, sinCostos } from '../variantes/variantes';
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateComponenteBaseDto } from './dto/create-componente-base.dto';

@Injectable()
export class ComponenteBaseService {
  constructor(private prisma: PrismaService) {}

  async calculateCost(recetaItems: { materiaPrimaId: number; cantidadNecesaria: number }[]): Promise<number> {
    let cost = 0;
    for (const item of recetaItems) {
      const mat = await this.prisma.materiaPrima.findUnique({
        where: { id: Number(item.materiaPrimaId) },
      });
      if (!mat) {
        throw new NotFoundException(`Materia prima con ID ${item.materiaPrimaId} no encontrada`);
      }
      cost += mat.costoUnitario * Number(item.cantidadNecesaria);
    }
    return cost;
  }

  async findAll(rolUser: string) {
    const items = await this.prisma.componenteBase.findMany({ include: componenteInclude, orderBy: { id: 'asc' } });
    const result = items.map(presentarComponente);
    return rolUser === 'OPERATIVO' ? sinCostos(result) : result;
  }

  async findOne(id: number, rolUser: string) {
    const item = await this.prisma.componenteBase.findUnique({ where: { id }, include: componenteInclude });
    if (!item) throw new NotFoundException('Componente base no encontrado');
    const result = presentarComponente(item);
    return rolUser === 'OPERATIVO' ? sinCostos(result) : result;
  }

  async addVariante(id: number, esenciaId: number) {
    return this.prisma.$transaction(async tx => {
      const comp = await tx.componenteBase.findUnique({ where: { id }, include: componenteInclude });
      const esencia = await tx.materiaPrima.findUnique({ where: { id: esenciaId } });
      if (!comp || !esencia) throw new NotFoundException('Componente o esencia no encontrado');
      recetaParaEsencia(comp, esencia);
      if (comp.variantes.some(v => v.esenciaId === esenciaId)) throw new ConflictException('Esta esencia ya existe en el componente');
      // Adoptar el stock previo en su aroma original al activar variantes.
      if (!comp.variantes.length) {
        const original = comp.recetaMaterias.find(r => r.materiaPrima.tipo === 'ESENCIA')!;
        await tx.componenteVariante.create({ data: { componenteBaseId: id, esenciaId: original.materiaPrimaId, stockDisponible: comp.stockDisponible } });
        if (original.materiaPrimaId === esenciaId) return;
      }
      return tx.componenteVariante.create({ data: { componenteBaseId: id, esenciaId } });
    }, { isolationLevel: 'Serializable' });
  }

  async fabricar(id: number, varianteId: number, cantidad: number) {
    return this.prisma.$transaction(async tx => {
      const comp = await tx.componenteBase.findUnique({ where: { id }, include: componenteInclude });
      const variante = comp?.variantes.find(v => v.id === varianteId);
      if (!comp || !variante) throw new BadRequestException('Selecciona una variante de este componente');
      const receta = recetaParaEsencia(comp, variante.esencia);
      for (const r of receta) {
        const consumo = r.cantidadNecesaria * cantidad;
        const updated = await tx.materiaPrima.updateMany({
          where: { id: r.materiaPrima.id, stockActual: { gte: consumo } },
          data: { stockActual: { decrement: consumo } },
        });
        if (updated.count !== 1) throw new BadRequestException(`Stock insuficiente de ${r.materiaPrima.nombre}`);
      }
      await tx.componenteVariante.update({ where: { id: varianteId }, data: { stockDisponible: { increment: cantidad } } });
      await tx.componenteBase.update({ where: { id }, data: { stockDisponible: { increment: cantidad } } });
      return { fabricadas: cantidad };
    }, { isolationLevel: 'Serializable' });
  }

  async create(dto: CreateComponenteBaseDto) {
    const existing = await this.prisma.componenteBase.findUnique({
      where: { nombre: dto.nombre },
    });
    if (existing) {
      throw new ConflictException('Ya existe un componente base con este nombre');
    }

    // Calcular costo de producción basado en la receta
    const costoProduccion = await this.calculateCost(dto.receta);

    return this.prisma.$transaction(async (tx) => {
      const comp = await tx.componenteBase.create({
        data: {
          nombre: dto.nombre,
          costoProduccion,
          stockDisponible: dto.stockDisponible,
          pesoAgua: dto.pesoAgua,
          tipoVela: dto.tipoVela,
          porcentajeEsencia: dto.porcentajeEsencia,
          imagenUrl: dto.imagenUrl,
        },
      });

      for (const recItem of dto.receta) {
        await tx.recetaComponente.create({
          data: {
            componenteBaseId: comp.id,
            materiaPrimaId: Number(recItem.materiaPrimaId),
            cantidadNecesaria: Number(recItem.cantidadNecesaria),
          },
        });
      }

      const recetaGuardada = await tx.recetaComponente.findMany({ where: { componenteBaseId: comp.id }, include: { materiaPrima: true } });
      const aromas = recetaGuardada.filter(r => r.materiaPrima.tipo === 'ESENCIA');
      if (aromas.length === 1) await tx.componenteVariante.create({ data: { componenteBaseId: comp.id, esenciaId: aromas[0].materiaPrimaId, stockDisponible: dto.stockDisponible } });

      return tx.componenteBase.findUnique({
        where: { id: comp.id },
        include: {
          recetaMaterias: {
            include: {
              materiaPrima: true,
            },
          },
        },
      });
    });
  }

  async update(id: number, dto: Partial<CreateComponenteBaseDto>) {
    const comp = await this.prisma.componenteBase.findUnique({
      where: { id },
    });
    if (!comp) {
      throw new NotFoundException('Componente base no encontrado');
    }

    if (dto.nombre && dto.nombre !== comp.nombre) {
      const existing = await this.prisma.componenteBase.findUnique({
        where: { nombre: dto.nombre },
      });
      if (existing) {
        throw new ConflictException('Ya existe un componente base con este nombre');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const variantes = await tx.componenteVariante.findMany({ where: { componenteBaseId: id }, include: { esencia: true } });
      if (variantes.length && dto.stockDisponible !== undefined && dto.stockDisponible !== comp.stockDisponible) {
        throw new BadRequestException('El stock por esencia se incrementa desde Fabricar');
      }
      if (dto.receta && variantes.length) {
        const recetaMaterias = await Promise.all(dto.receta.map(async r => {
          const materiaPrima = await tx.materiaPrima.findUnique({ where: { id: Number(r.materiaPrimaId) } });
          if (!materiaPrima) throw new NotFoundException('Materia prima no encontrada');
          return { ...r, materiaPrima };
        }));
        for (const v of variantes) recetaParaEsencia({ recetaMaterias }, v.esencia);
      }
      let costoProduccion = comp.costoProduccion;
      if (dto.receta) {
        costoProduccion = await this.calculateCost(dto.receta);
        // Borrar recetas anteriores
        await tx.recetaComponente.deleteMany({
          where: { componenteBaseId: id },
        });
        // Crear nuevas
        for (const recItem of dto.receta) {
          await tx.recetaComponente.create({
            data: {
              componenteBaseId: id,
              materiaPrimaId: Number(recItem.materiaPrimaId),
              cantidadNecesaria: Number(recItem.cantidadNecesaria),
            },
          });
        }
      }

      await tx.componenteBase.update({
        where: { id },
        data: {
          nombre: dto.nombre,
          costoProduccion,
          stockDisponible: dto.stockDisponible !== undefined ? dto.stockDisponible : comp.stockDisponible,
          pesoAgua: dto.pesoAgua !== undefined ? dto.pesoAgua : comp.pesoAgua,
          tipoVela: dto.tipoVela !== undefined ? dto.tipoVela : comp.tipoVela,
          porcentajeEsencia: dto.porcentajeEsencia !== undefined ? dto.porcentajeEsencia : comp.porcentajeEsencia,
          imagenUrl: dto.imagenUrl !== undefined ? dto.imagenUrl : comp.imagenUrl,
        },
      });

      return tx.componenteBase.findUnique({
        where: { id },
        include: {
          recetaMaterias: {
            include: {
              materiaPrima: true,
            },
          },
        },
      });
    });
  }

  async remove(id: number) {
    const comp = await this.prisma.componenteBase.findUnique({
      where: { id },
    });
    if (!comp) {
      throw new NotFoundException('Componente base no encontrado');
    }

    // Verificar si está asociado a alguna fórmula de producto antes de eliminar
    const asociacion = await this.prisma.estructuraEnsamble.findFirst({
      where: { componenteBaseId: id },
      include: {
        catalogoProducto: true,
      },
    });

    if (asociacion) {
      throw new ConflictException(
        `No se puede eliminar el componente base porque está siendo utilizado en la fórmula de ensamble de: "${asociacion.catalogoProducto.nombre}"`
      );
    }

    return this.prisma.componenteBase.delete({
      where: { id },
    });
  }
}
