import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCatalogoDto } from './dto/create-catalogo.dto';

@Injectable()
export class CatalogoService {
  constructor(private prisma: PrismaService) {}

  async findAll(rolUser: string) {
    const list = await this.prisma.catalogoProducto.findMany({
      include: {
        ensambles: {
          include: {
            componenteBase: true,
          },
        },
        ensamblesMateriaPrima: {
          include: {
            materiaPrima: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    if (rolUser === 'OPERATIVO') {
      return list.map(prod => {
        const { ensambles, ensamblesMateriaPrima, ...rest } = prod;
        const safeEns = ensambles.map(ens => {
          const { componenteBase, ...ensRest } = ens;
          const { costoProduccion, ...compRest } = componenteBase;
          return {
            ...ensRest,
            componenteBase: compRest,
          };
        });
        return {
          ...rest,
          ensambles: safeEns,
          ensamblesMateriaPrima: ensamblesMateriaPrima.map(ens => {
            const { materiaPrima, ...ensRest } = ens;
            const { costoUnitario, ...materiaPrimaSegura } = materiaPrima;
            return { ...ensRest, materiaPrima: materiaPrimaSegura };
          }),
        };
      });
    }
    return list;
  }

  async findOne(id: number, rolUser: string) {
    const prod = await this.prisma.catalogoProducto.findUnique({
      where: { id },
      include: {
        ensambles: {
          include: {
            componenteBase: true,
          },
        },
        ensamblesMateriaPrima: {
          include: {
            materiaPrima: true,
          },
        },
      },
    });
    if (!prod) {
      throw new NotFoundException('Producto del catálogo no encontrado');
    }
    if (rolUser === 'OPERATIVO') {
      const { ensambles, ensamblesMateriaPrima, ...rest } = prod;
      const safeEns = ensambles.map(ens => {
        const { componenteBase, ...ensRest } = ens;
        const { costoProduccion, ...compRest } = componenteBase;
        return {
          ...ensRest,
          componenteBase: compRest,
        };
      });
      return {
        ...rest,
        ensambles: safeEns,
        ensamblesMateriaPrima: ensamblesMateriaPrima.map(ens => {
          const { materiaPrima, ...ensRest } = ens;
          const { costoUnitario, ...materiaPrimaSegura } = materiaPrima;
          return { ...ensRest, materiaPrima: materiaPrimaSegura };
        }),
      };
    }
    return prod;
  }

  async create(dto: CreateCatalogoDto) {
    const existing = await this.prisma.catalogoProducto.findUnique({
      where: { nombre: dto.nombre },
    });
    if (existing) {
      throw new ConflictException('Ya existe un producto con este nombre en el catálogo');
    }

    return this.prisma.$transaction(async (tx) => {
      const prod = await tx.catalogoProducto.create({
        data: {
          nombre: dto.nombre,
          precioVenta: dto.precioVenta,
          requiereEnsamble: dto.requiereEnsamble ?? false,
          imagenUrl: dto.imagenUrl,
        },
      });

      if (dto.requiereEnsamble && dto.ensambles) {
        for (const ensItem of dto.ensambles) {
          const comp = await tx.componenteBase.findUnique({
            where: { id: ensItem.componenteBaseId },
          });
          if (!comp) {
            throw new NotFoundException(`Componente base con ID ${ensItem.componenteBaseId} no encontrado`);
          }

          await tx.estructuraEnsamble.create({
            data: {
              catalogoProductoId: prod.id,
              componenteBaseId: ensItem.componenteBaseId,
              cantidadNecesaria: ensItem.cantidadNecesaria,
            },
          });
        }
      }

      if (dto.requiereEnsamble && dto.materiasPrimas) {
        for (const materiaItem of dto.materiasPrimas) {
          const materiaPrima = await tx.materiaPrima.findUnique({
            where: { id: materiaItem.materiaPrimaId },
          });
          if (!materiaPrima) {
            throw new NotFoundException(`Materia prima con ID ${materiaItem.materiaPrimaId} no encontrada`);
          }

          await tx.estructuraEnsambleMateriaPrima.create({
            data: {
              catalogoProductoId: prod.id,
              materiaPrimaId: materiaItem.materiaPrimaId,
              cantidadNecesaria: materiaItem.cantidadNecesaria,
            },
          });
        }
      }

      return tx.catalogoProducto.findUnique({
        where: { id: prod.id },
        include: {
        ensambles: {
          include: {
            componenteBase: true,
          },
        },
        ensamblesMateriaPrima: {
          include: {
            materiaPrima: true,
          },
        },
        },
      });
    });
  }

  async update(id: number, dto: Partial<CreateCatalogoDto>) {
    const prod = await this.prisma.catalogoProducto.findUnique({
      where: { id },
    });
    if (!prod) {
      throw new NotFoundException('Producto del catálogo no encontrado');
    }

    if (dto.nombre && dto.nombre !== prod.nombre) {
      const existing = await this.prisma.catalogoProducto.findUnique({
        where: { nombre: dto.nombre },
      });
      if (existing) {
        throw new ConflictException('Ya existe un producto con este nombre en el catálogo');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const requiereEnsamble = dto.requiereEnsamble !== undefined ? dto.requiereEnsamble : prod.requiereEnsamble;

      await tx.catalogoProducto.update({
        where: { id },
        data: {
          nombre: dto.nombre,
          precioVenta: dto.precioVenta !== undefined ? dto.precioVenta : prod.precioVenta,
          requiereEnsamble,
          imagenUrl: dto.imagenUrl !== undefined ? dto.imagenUrl : prod.imagenUrl,
        },
      });

      if (dto.ensambles !== undefined || dto.materiasPrimas !== undefined) {
        await tx.estructuraEnsamble.deleteMany({
          where: { catalogoProductoId: id },
        });
        await tx.estructuraEnsambleMateriaPrima.deleteMany({
          where: { catalogoProductoId: id },
        });

        if (requiereEnsamble && dto.ensambles) {
          for (const ensItem of dto.ensambles) {
            const comp = await tx.componenteBase.findUnique({
              where: { id: ensItem.componenteBaseId },
            });
            if (!comp) {
              throw new NotFoundException(`Componente base con ID ${ensItem.componenteBaseId} no encontrado`);
            }

            await tx.estructuraEnsamble.create({
              data: {
                catalogoProductoId: id,
                componenteBaseId: ensItem.componenteBaseId,
                cantidadNecesaria: ensItem.cantidadNecesaria,
              },
            });
          }
        }

        if (requiereEnsamble && dto.materiasPrimas) {
          for (const materiaItem of dto.materiasPrimas) {
            const materiaPrima = await tx.materiaPrima.findUnique({
              where: { id: materiaItem.materiaPrimaId },
            });
            if (!materiaPrima) {
              throw new NotFoundException(`Materia prima con ID ${materiaItem.materiaPrimaId} no encontrada`);
            }

            await tx.estructuraEnsambleMateriaPrima.create({
              data: {
                catalogoProductoId: id,
                materiaPrimaId: materiaItem.materiaPrimaId,
                cantidadNecesaria: materiaItem.cantidadNecesaria,
              },
            });
          }
        }
      }

      return tx.catalogoProducto.findUnique({
        where: { id },
        include: {
        ensambles: {
          include: {
            componenteBase: true,
          },
        },
        ensamblesMateriaPrima: {
          include: {
            materiaPrima: true,
          },
        },
        },
      });
    });
  }

  async remove(id: number) {
    const prod = await this.prisma.catalogoProducto.findUnique({
      where: { id },
    });
    if (!prod) {
      throw new NotFoundException('Producto del catálogo no encontrado');
    }
    return this.prisma.catalogoProducto.delete({
      where: { id },
    });
  }
}
