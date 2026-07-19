import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { MateriaPrimaService } from './materia-prima.service';
import { CreateMateriaPrimaDto } from './dto/create-materia-prima.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('materia-prima')
export class MateriaPrimaController {
  constructor(private service: MateriaPrimaService) {}

  @Get()
  async findAll(@Request() req) {
    return this.service.findAll(req.user.rol);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.service.findOne(id, req.user.rol);
  }

  @Roles('ADMIN')
  @Post()
  async create(@Body() dto: CreateMateriaPrimaDto) {
    return this.service.create(dto);
  }

  @Roles('ADMIN')
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateMateriaPrimaDto>) {
    return this.service.update(id, dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
