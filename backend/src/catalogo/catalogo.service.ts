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
      },
      orderBy: { id: 'asc' },
    });

    if (rolUser === 'OPERATIVO') {
      return list.map(prod => {
        const { ensambles, ...rest } = prod;
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
      },
    });
    if (!prod) {
      throw new NotFoundException('Producto del catálogo no encontrado');
    }
    if (rolUser === 'OPERATIVO') {
      const { ensambles, ...rest } = prod;
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

      return tx.catalogoProducto.findUnique({
        where: { id: prod.id },
        include: {
          ensambles: {
            include: {
              componenteBase: true,
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

      if (dto.ensambles !== undefined) {
        await tx.estructuraEnsamble.deleteMany({
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
      }

      return tx.catalogoProducto.findUnique({
        where: { id },
        include: {
          ensambles: {
            include: {
              componenteBase: true,
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
