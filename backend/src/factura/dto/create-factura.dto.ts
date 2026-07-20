import { IsNotEmpty, IsString, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateFacturaDto {
  @IsOptional()
  @IsString()
  numeroFactura?: string;

  @IsNotEmpty({ message: 'El proveedor es requerido' })
  @IsString()
  proveedor: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe ser un formato de fecha válido' })
  fecha?: string;

  @IsNotEmpty({ message: 'El monto total es requerido' })
  @IsNumber({}, { message: 'El monto total debe ser un número' })
  @Min(0, { message: 'El monto total no puede ser negativo' })
  montoTotal: number;

  @IsNotEmpty({ message: 'La categoría es requerida' })
  @IsString()
  categoria: string;

  @IsNotEmpty({ message: 'El comprador es requerido' })
  @IsString()
  comprador: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
