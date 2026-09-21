import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateComponenteBaseDto } from './create-componente-base.dto';

export class CreateGrupoComponentesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => CreateComponenteBaseDto)
  componentes: CreateComponenteBaseDto[];
}
