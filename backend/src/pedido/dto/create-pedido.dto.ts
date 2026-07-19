import { IsNotEmpty, IsString, IsIn, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class DetallePedidoDto {
  @IsNotEmpty()
  catalogoProductoId: number;

  @IsNotEmpty()
  @Type(() => Number)
  cantidad: number;
}

export class CreatePedidoDto {
  @IsNotEmpty({ message: 'El cliente es requerido' })
  @IsString()
  cliente: string;

  @IsNotEmpty({ message: 'El canal es requerido' })
  @IsIn(['WHATSAPP', 'INSTAGRAM', 'TIKTOK', 'OTRO'], { message: 'Canal inválido' })
  canal: string;

  @IsOptional()
  @IsIn(['POR_FABRICAR', 'EN_EMPAQUE', 'ENTREGADO'], { message: 'Estado inválido' })
  estado?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetallePedidoDto)
  detalles: DetallePedidoDto[];
}
