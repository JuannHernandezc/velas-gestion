import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMateriaPrimaDto } from './dto/create-materia-prima.dto';

@Injectable()
export class MateriaPrimaService {
  constructor(private prisma: PrismaService) {}

  async findAll(rolUser: string) {
    const list = await this.prisma.materiaPrima.findMany({
      orderBy: { id: 'asc' },
    });

    if (rolUser === 'OPERATIVO') {
      return list.map(item => {
        const { costoUnitario, ...rest } = item;
        return rest;
      });
    }
    return list;
  }

  async findOne(id: number, rolUser: string) {
    const item = await this.prisma.materiaPrima.findUnique({
      where: { id },
    });
    if (!item) {
      throw new NotFoundException('Materia prima no encontrada');
    }
    if (rolUser === 'OPERATIVO') {
      const { costoUnitario, ...rest } = item;
      return rest;
    }
    return item;
  }

  async create(dto: CreateMateriaPrimaDto) {
    const existing = await this.prisma.materiaPrima.findUnique({
      where: { nombre: dto.nombre },
    });
    if (existing) {
      throw new ConflictException('Ya existe una materia prima con este nombre');
    }

    return this.prisma.materiaPrima.create({
      data: dto,
    });
  }

  async update(id: number, dto: Partial<CreateMateriaPrimaDto>) {
    const item = await this.prisma.materiaPrima.findUnique({
      where: { id },
    });
    if (!item) {
      throw new NotFoundException('Materia prima no encontrada');
    }

    if (dto.nombre && dto.nombre !== item.nombre) {
      const existing = await this.prisma.materiaPrima.findUnique({
        where: { nombre: dto.nombre },
      });
      if (existing) {
        throw new ConflictException('Ya existe una materia prima con este nombre');
      }
    }

    return this.prisma.materiaPrima.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    const item = await this.prisma.materiaPrima.findUnique({
      where: { id },
    });
    if (!item) {
      throw new NotFoundException('Materia prima no encontrada');
    }

    // Verificar si está asociada a alguna receta antes de eliminar
    const asociacion = await this.prisma.recetaComponente.findFirst({
      where: { materiaPrimaId: id },
      include: {
        componenteBase: true,
      },
    });

    if (asociacion) {
      throw new ConflictException(
        `No se puede eliminar la materia prima porque está siendo utilizada en la receta de: "${asociacion.componenteBase.nombre}"`
      );
    }

    return this.prisma.materiaPrima.delete({
      where: { id },
    });
  }
}
