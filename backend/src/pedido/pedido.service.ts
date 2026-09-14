import { catalogoInclude, costoReceta, recetaParaEsencia } from '../variantes/variantes';
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
    if (!dto.detalles?.length) throw new BadRequestException('El pedido debe tener al menos un producto');
    return this.prisma.$transaction(async tx => {
      let total = 0;
      let costoTotal = 0;
      const detallesData: any[] = [];
      for (const item of dto.detalles) {
        if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) throw new BadRequestException('La cantidad debe ser un entero positivo');
        const prod = await tx.catalogoProducto.findUnique({ where: { id: item.catalogoProductoId }, include: catalogoInclude });
        if (!prod) throw new NotFoundException('Producto no encontrado');
        const variante = prod.variantes.find(v => v.id === item.varianteId);
        const requiereVariante = prod.variantes.length > 0 || (prod.requiereEnsamble && prod.ensambles.some(e => e.componenteBase.variantes.length > 0));
        if ((requiereVariante && !variante) || (item.varianteId && !variante)) throw new BadRequestException(`Selecciona una variante de esencia con precio configurado para ${prod.nombre}`);
        let costoUnitario = 0;
        const descripcion: string[] = [];
        if (prod.requiereEnsamble) {
          for (const ens of prod.ensambles) {
            const comp = ens.componenteBase;
            const qty = ens.cantidadNecesaria * item.cantidad;
            if (comp.variantes.length) {
              const selected = variante?.selecciones.find(s => s.componenteVariante.componenteBaseId === comp.id);
              const aroma = comp.variantes.find(v => v.id === selected?.componenteVarianteId);
              if (!aroma) throw new BadRequestException(`Falta configurar la esencia de ${comp.nombre} en el catálogo`);
              const updated = await tx.componenteVariante.updateMany({ where: { id: aroma.id, stockDisponible: { gte: qty } }, data: { stockDisponible: { decrement: qty } } });
              if (updated.count !== 1) throw new BadRequestException(`Stock insuficiente: ${comp.nombre} · ${aroma.esencia.nombre}`);
              costoUnitario += costoReceta(recetaParaEsencia(comp, aroma.esencia)) * ens.cantidadNecesaria;
              descripcion.push(`${comp.nombre} · ${aroma.esencia.nombre}`);
              await tx.componenteBase.update({ where: { id: comp.id }, data: { stockDisponible: { decrement: qty } } });
            } else {
              const updated = await tx.componenteBase.updateMany({ where: { id: comp.id, stockDisponible: { gte: qty } }, data: { stockDisponible: { decrement: qty } } });
              if (updated.count !== 1) throw new BadRequestException(`Stock insuficiente: ${comp.nombre}`);
              costoUnitario += costoReceta(comp.recetaMaterias) * ens.cantidadNecesaria;
              descripcion.push(comp.nombre);
            }
          }
          for (const m of prod.ensamblesMateriaPrima) {
            const qty = m.cantidadNecesaria * item.cantidad;
            const updated = await tx.materiaPrima.updateMany({ where: { id: m.materiaPrimaId, stockActual: { gte: qty } }, data: { stockActual: { decrement: qty } } });
            if (updated.count !== 1) throw new BadRequestException(`Stock insuficiente: ${m.materiaPrima.nombre}`);
            costoUnitario += m.materiaPrima.costoUnitario * m.cantidadNecesaria;
          }
        }
        const precioUnitario = variante?.precioVenta ?? prod.precioVenta;
        total += precioUnitario * item.cantidad;
        costoTotal += costoUnitario * item.cantidad;
        detallesData.push({ catalogoProductoId: prod.id, varianteId: variante?.id,
          descripcionVariante: variante ? `${variante.nombre}: ${descripcion.join(' / ')}` : descripcion.join(' / ') || null,
          cantidad: item.cantidad, precioUnitario, costoUnitario });
      }
      return tx.pedido.create({ data: {
        cliente: dto.cliente, canal: dto.canal, estado: dto.estado ?? 'POR_FABRICAR',
        total, costoTotal, rentabilidad: total - costoTotal,
        detalles: { createMany: { data: detallesData } },
      }, include: { detalles: { include: { catalogoProducto: true } } } });
    }, { isolationLevel: 'Serializable' });
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
    const materias = await this.prisma.materiaPrima.findMany({
      where: { stockMinimo: { not: null } },
    });
    const alertMaterias = materias.filter(
      m => m.stockMinimo !== null && m.stockActual < m.stockMinimo,
    );

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
