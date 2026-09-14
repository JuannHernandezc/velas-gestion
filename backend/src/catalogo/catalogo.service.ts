import { catalogoInclude, presentarCatalogo, sinCostos } from '../variantes/variantes';
import { VarianteCatalogoDto } from './dto/variante-catalogo.dto';
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCatalogoDto } from './dto/create-catalogo.dto';

@Injectable()
export class CatalogoService {
  constructor(private prisma: PrismaService) {}

  async findAll(rolUser: string) {
    const items = await this.prisma.catalogoProducto.findMany({ include: catalogoInclude, orderBy: { id: 'asc' } });
    const result = items.map(presentarCatalogo);
    return rolUser === 'OPERATIVO' ? sinCostos(result) : result;
  }
  async findOne(id: number, rolUser: string) {
    const item = await this.prisma.catalogoProducto.findUnique({ where: { id }, include: catalogoInclude });
    if (!item) throw new NotFoundException('Producto no encontrado');
    const result = presentarCatalogo(item);
    return rolUser === 'OPERATIVO' ? sinCostos(result) : result;
  }

  async saveVariante(id: number, dto: VarianteCatalogoDto) {
    return this.prisma.$transaction(async tx => {
      const prod = await tx.catalogoProducto.findUnique({ where: { id }, include: catalogoInclude });
      if (!prod) throw new NotFoundException('Producto no encontrado');
      if (!prod.requiereEnsamble) throw new BadRequestException('Vincula los componentes de la vela en la fórmula de ensamble');
      const requeridos = prod.ensambles.filter(e => e.componenteBase.variantes.length);
      if (!requeridos.length || dto.componenteVarianteIds.length !== requeridos.length || requeridos.some(e => !e.componenteBase.variantes.some(v => dto.componenteVarianteIds.includes(v.id)))) {
        throw new BadRequestException('Selecciona una esencia por cada componente con variantes');
      }
      if (dto.id && !prod.variantes.some(v => v.id === dto.id)) throw new BadRequestException('La variante no pertenece a este producto');
      if (prod.variantes.some(v => v.id !== dto.id && v.nombre === dto.nombre.trim())) throw new ConflictException('Ya existe una variante con ese nombre');
      const data = { nombre: dto.nombre.trim(), precioVenta: dto.precioVenta };
      if (!data.nombre) throw new BadRequestException('El nombre es requerido');
      const variante = dto.id
        ? await tx.catalogoVariante.update({ where: { id: dto.id }, data })
        : await tx.catalogoVariante.create({ data: { ...data, catalogoProductoId: id } });
      await tx.seleccionVariante.deleteMany({ where: { catalogoVarianteId: variante.id } });
      await tx.seleccionVariante.createMany({ data: dto.componenteVarianteIds.map(componenteVarianteId => ({ catalogoVarianteId: variante.id, componenteVarianteId })) });
      return variante;
    }, { isolationLevel: 'Serializable' });
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
      const existing = await tx.catalogoProducto.findUnique({ where: { id }, include: catalogoInclude });
      if (existing?.variantes.length) {
        const oldIds = existing.ensambles.map(e => e.componenteBaseId).sort().join(',');
        const newIds = dto.ensambles?.map(e => e.componenteBaseId).sort().join(',') ?? oldIds;
        if (!requiereEnsamble || oldIds !== newIds) throw new BadRequestException('Este producto tiene variantes: conserva sus componentes o crea otro producto para una fórmula diferente');
      }


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
