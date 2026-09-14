import { IsInt, Min, IsNumber } from 'class-validator';
export class CreateVarianteDto {
  @IsInt() @Min(1) esenciaId: number;
}
export class FabricarVarianteDto {
  @IsInt() @Min(1) varianteId: number;
  @IsInt() @Min(1) cantidad: number;
}
