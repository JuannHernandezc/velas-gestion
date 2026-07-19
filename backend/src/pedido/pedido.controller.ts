import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { PedidoService } from './pedido.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pedido')
export class PedidoController {
  constructor(private service: PedidoService) {}

  @Get()
  async findAll(@Request() req) {
    return this.service.findAll(req.user.rol);
  }

  @Get('dashboard')
  async getDashboard(@Request() req) {
    return this.service.getDashboardMetrics(req.user.rol);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.service.findOne(id, req.user.rol);
  }

  @Post()
  async create(@Body() dto: CreatePedidoDto) {
    return this.service.create(dto);
  }

  @Put(':id/estado')
  async updateEstado(@Param('id', ParseIntPipe) id: number, @Body('estado') estado: string) {
    return this.service.updateEstado(id, estado);
  }

  @Roles('ADMIN')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
