import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';

@Injectable()
export class PedidoService {
  constructor(private prisma: PrismaService) {}

  async findAll(rolUser: string) {
    const list = await this.prisma.pedido.findMany({
      include: {
        detalles: {
          include: {
            catalogoProducto: true,
          },
        },
      },
      orderBy: { fecha: 'desc' },
    });

    if (rolUser === 'OPERATIVO') {
      return list.map(ped => {
        const { costoTotal, rentabilidad, detalles, ...rest } = ped;
        const safeDetalles = detalles.map(det => {
          const { costoUnitario, ...detRest } = det;
          return detRest;
        });
        return {
          ...rest,
          detalles: safeDetalles,
        };
      });
    }
    return list;
  }

  async findOne(id: number, rolUser: string) {
    const ped = await this.prisma.pedido.findUnique({
      where: { id },
      include: {
        detalles: {
          include: {
            catalogoProducto: true,
          },
        },
      },
    });
    if (!ped) {
      throw new NotFoundException('Pedido no encontrado');
    }
    if (rolUser === 'OPERATIVO') {
      const { costoTotal, rentabilidad, detalles, ...rest } = ped;
      const safeDetalles = detalles.map(det => {
        const { costoUnitario, ...detRest } = det;
        return detRest;
      });
      return {
        ...rest,
        detalles: safeDetalles,
      };
    }
    return ped;
  }

  async create(dto: CreatePedidoDto) {
    if (!dto.detalles || dto.detalles.length === 0) {
      throw new BadRequestException('El pedido debe tener al menos un producto');
    }

    return this.prisma.$transaction(async (tx) => {
      let total = 0;
      let costoTotal = 0;

      const detallesData: any[] = [];

      for (const item of dto.detalles) {
        const prod = await tx.catalogoProducto.findUnique({
          where: { id: item.catalogoProductoId },
          include: {
            ensambles: {
              include: {
                componenteBase: true,
              },
            },
          },
        });

        if (!prod) {
          throw new NotFoundException(`Producto con ID ${item.catalogoProductoId} no encontrado en el catálogo`);
        }

        let costoUnitarioProducto = 0;

        if (prod.requiereEnsamble && prod.ensambles) {
          for (const ens of prod.ensambles) {
            const qtyNeeded = ens.cantidadNecesaria * item.cantidad;
            
            // Verificar stock del componente
            if (ens.componenteBase.stockDisponible < qtyNeeded) {
              throw new BadRequestException(
                `Stock insuficiente para el componente base "${ens.componenteBase.nombre}". Requerido: ${qtyNeeded}, Disponible: ${ens.componenteBase.stockDisponible}`
              );
            }

            // Descontar stock del componente base
            await tx.componenteBase.update({
              where: { id: ens.componenteBaseId },
              data: {
                stockDisponible: {
                  decrement: qtyNeeded,
                },
              },
            });

            costoUnitarioProducto += ens.componenteBase.costoProduccion * ens.cantidadNecesaria;
          }
        }

        total += prod.precioVenta * item.cantidad;
        costoTotal += costoUnitarioProducto * item.cantidad;

        detallesData.push({
          catalogoProductoId: prod.id,
          cantidad: item.cantidad,
          precioUnitario: prod.precioVenta,
          costoUnitario: costoUnitarioProducto,
        });
      }

      const rentabilidad = total - costoTotal;

      const ped = await tx.pedido.create({
        data: {
          cliente: dto.cliente,
          canal: dto.canal,
          estado: dto.estado ?? 'POR_FABRICAR',
          total,
          costoTotal,
          rentabilidad,
          detalles: {
            createMany: {
              data: detallesData,
            },
          },
        },
        include: {
          detalles: {
            include: {
              catalogoProducto: true,
            },
          },
        },
      });

      return ped;
    });
  }

  async updateEstado(id: number, estado: string) {
    const ped = await this.prisma.pedido.findUnique({
      where: { id },
    });
    if (!ped) {
      throw new NotFoundException('Pedido no encontrado');
    }
    if (!['POR_FABRICAR', 'EN_EMPAQUE', 'ENTREGADO'].includes(estado)) {
      throw new BadRequestException('Estado de pedido inválido');
    }

    return this.prisma.pedido.update({
      where: { id },
      data: { estado },
    });
  }

  async remove(id: number) {
    const ped = await this.prisma.pedido.findUnique({
      where: { id },
    });
    if (!ped) {
      throw new NotFoundException('Pedido no encontrado');
    }
    return this.prisma.pedido.delete({
      where: { id },
    });
  }

  // Métricas del Dashboard
  async getDashboardMetrics(rolUser: string) {
    const salesAgg = await this.prisma.pedido.aggregate({
      _sum: {
        total: true,
        costoTotal: true,
        rentabilidad: true,
      },
    });

    const totalVentas = salesAgg._sum.total ?? 0;
    const totalCostos = salesAgg._sum.costoTotal ?? 0;
    const totalRentabilidad = salesAgg._sum.rentabilidad ?? 0;

    // Alertas de stock bajo
    const materias = await this.prisma.materiaPrima.findMany();
    const alertMaterias = materias.filter(m => m.stockActual < m.stockMinimo);

    const componentes = await this.prisma.componenteBase.findMany();
    const alertComponentes = componentes.filter(c => c.stockDisponible < 5); // Menos de 5 unidades

    // Agrupación por canal
    const groupCanales = await this.prisma.pedido.groupBy({
      by: ['canal'],
      _count: {
        id: true,
      },
      _sum: {
        total: true,
      },
    });

    // Agrupación por estado de pedido
    const groupEstados = await this.prisma.pedido.groupBy({
      by: ['estado'],
      _count: {
        id: true,
      },
    });

    // Cargar últimos pedidos aplicando restricciones de rol
    const ultimosPedidos = await this.findAll(rolUser);

    const metrics: any = {
      totalVentas,
      pedidosRealizados: await this.prisma.pedido.count(),
      alertasStockBajo: alertMaterias.length + alertComponentes.length,
      alertasDetalle: {
        materiasPrimas: alertMaterias.map(m => {
          if (rolUser === 'OPERATIVO') {
            const { costoUnitario, ...rest } = m;
            return rest;
          }
          return m;
        }),
        componentesBases: alertComponentes.map(c => {
          if (rolUser === 'OPERATIVO') {
            const { costoProduccion, ...rest } = c;
            return rest;
          }
          return c;
        }),
      },
      ventasPorCanal: groupCanales.map(g => ({
        canal: g.canal,
        cantidadPedidos: g._count.id,
        montoTotal: g._sum.total ?? 0,
      })),
      pedidosPorEstado: groupEstados.map(g => ({
        estado: g.estado,
        cantidad: g._count.id,
      })),
      ultimosPedidos: ultimosPedidos.slice(0, 5),
    };

    if (rolUser !== 'OPERATIVO') {
      metrics.totalCostos = totalCostos;
      metrics.totalRentabilidad = totalRentabilidad;
      metrics.margenRentabilidad = totalVentas > 0 ? (totalRentabilidad / totalVentas) * 100 : 0;
    }

    return metrics;
  }
}
