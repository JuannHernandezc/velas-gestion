import { IsNotEmpty, IsString, IsNumber, Min, IsArray, ValidateNested, IsOptional, IsIn, Max } from 'class-validator';
import { Type } from 'class-transformer';

class RecetaItemDto {
  @IsNotEmpty()
  @IsNumber()
  materiaPrimaId: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.0001, { message: 'La cantidad debe ser mayor a 0' })
  cantidadNecesaria: number;
}

export class CreateComponenteBaseDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString()
  nombre: string;

  @IsNotEmpty({ message: 'El stock disponible es requerido' })
  @IsNumber({}, { message: 'El stock disponible debe ser un número' })
  @Min(0, { message: 'El stock disponible no puede ser negativo' })
  stockDisponible: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecetaItemDto)
  receta: RecetaItemDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  pesoAgua?: number;

  @IsOptional()
  @IsString()
  @IsIn(['DECORATIVA', 'AROMATICA'])
  tipoVela?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  porcentajeEsencia?: number;
}
