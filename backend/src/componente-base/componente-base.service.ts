import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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
    const list = await this.prisma.componenteBase.findMany({
      include: {
        recetaMaterias: {
          include: {
            materiaPrima: true,
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    if (rolUser === 'OPERATIVO') {
      return list.map(item => {
        // Ocultar costo de producción
        const { costoProduccion, recetaMaterias, ...rest } = item;
        // Ocultar costos dentro de la materia prima en la receta
        const safeRecipe = recetaMaterias.map(rm => {
          const { materiaPrima, ...rmRest } = rm;
          const { costoUnitario, ...mpRest } = materiaPrima;
          return {
            ...rmRest,
            materiaPrima: mpRest,
          };
        });
        return {
          ...rest,
          recetaMaterias: safeRecipe,
        };
      });
    }
    return list;
  }

  async findOne(id: number, rolUser: string) {
    const item = await this.prisma.componenteBase.findUnique({
      where: { id },
      include: {
        recetaMaterias: {
          include: {
            materiaPrima: true,
          },
        },
      },
    });
    if (!item) {
      throw new NotFoundException('Componente base no encontrado');
    }
    if (rolUser === 'OPERATIVO') {
      const { costoProduccion, recetaMaterias, ...rest } = item;
      const safeRecipe = recetaMaterias.map(rm => {
        const { materiaPrima, ...rmRest } = rm;
        const { costoUnitario, ...mpRest } = materiaPrima;
        return {
          ...rmRest,
          materiaPrima: mpRest,
        };
      });
      return {
        ...rest,
        recetaMaterias: safeRecipe,
      };
    }
    return item;
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
