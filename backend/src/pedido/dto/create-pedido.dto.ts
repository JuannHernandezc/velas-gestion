import { IsNotEmpty, IsString, IsIn, IsArray, ValidateNested, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

class DetallePedidoDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  catalogoProductoId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  varianteId?: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
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
