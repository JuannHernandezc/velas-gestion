import { ArrayUnique, IsArray, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
export class VarianteCatalogoDto {
  @IsOptional() @IsInt() @Min(1) id?: number;
  @IsString() @MinLength(1) nombre: string;
  @IsNumber() @Min(0) precioVenta: number;
  @IsArray() @ArrayUnique() @IsInt({ each: true }) @Min(1, { each: true }) componenteVarianteIds: number[];
}
