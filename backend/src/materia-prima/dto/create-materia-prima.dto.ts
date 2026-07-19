import { IsNotEmpty, IsString, IsNumber, Min, IsIn } from 'class-validator';

export class CreateMateriaPrimaDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString()
  nombre: string;

  @IsNotEmpty({ message: 'El tipo de insumo es requerido' })
  @IsString()
  @IsIn(['CERA', 'ESENCIA', 'ADITIVO', 'PABILO', 'MOLDE', 'DECORACION', 'INSUMO_GENERAL'])
  tipo: string;

  @IsNotEmpty({ message: 'La unidad de medida es requerida' })
  @IsString()
  unidadMedida: string; // GR, ML, CM, UNIDAD, MOLDE, DECORACION

  @IsNotEmpty({ message: 'El costo unitario es requerido' })
  @IsNumber({}, { message: 'El costo unitario debe ser un número' })
  @Min(0, { message: 'El costo unitario no puede ser negativo' })
  costoUnitario: number;

  @IsNotEmpty({ message: 'El stock actual es requerido' })
  @IsNumber({}, { message: 'El stock actual debe ser un número' })
  @Min(0, { message: 'El stock actual no puede ser negativo' })
  stockActual: number;

  @IsNotEmpty({ message: 'El stock mínimo es requerido' })
  @IsNumber({}, { message: 'El stock mínimo debe ser un número' })
  @Min(0, { message: 'El stock mínimo no puede ser negativo' })
  stockMinimo: number;
}
