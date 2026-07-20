import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFacturaDto } from './dto/create-factura.dto';

@Injectable()
export class FacturaService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateFacturaDto) {
    const fecha = dto.fecha ? new Date(dto.fecha) : new Date();
    return this.prisma.factura.create({
      data: {
        numeroFactura: dto.numeroFactura || null,
        proveedor: dto.proveedor,
        fecha,
        montoTotal: dto.montoTotal,
        categoria: dto.categoria,
        comprador: dto.comprador,
        descripcion: dto.descripcion || null,
      },
    });
  }

  async findAll() {
    return this.prisma.factura.findMany({
      orderBy: {
        fecha: 'desc',
      },
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.factura.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Factura con ID ${id} no encontrada`);
    }
    return this.prisma.factura.delete({
      where: { id },
    });
  }
}
