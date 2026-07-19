import { IsNotEmpty, IsString, IsNumber, Min, IsBoolean, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class EnsambleItemDto {
  @IsNotEmpty()
  @IsNumber()
  componenteBaseId: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.0001, { message: 'La cantidad debe ser mayor a 0' })
  cantidadNecesaria: number;
}

export class CreateCatalogoDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString()
  nombre: string;

  @IsNotEmpty({ message: 'El precio de venta es requerido' })
  @IsNumber({}, { message: 'El precio de venta debe ser un número' })
  @Min(0, { message: 'El precio de venta no puede ser negativo' })
  precioVenta: number;

  @IsOptional()
  @IsBoolean()
  requiereEnsamble?: boolean;

  @IsOptional()
  @IsString()
  imagenUrl?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnsambleItemDto)
  ensambles?: EnsambleItemDto[];
}
