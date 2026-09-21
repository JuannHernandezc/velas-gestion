import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateComponenteBaseDto } from './create-componente-base.dto';

export class CreateConfiguracionGrupoDto extends CreateComponenteBaseDto {
  @IsOptional()
  @IsIn(['APF', 'MOLDE'])
  tipoCera?: 'APF' | 'MOLDE';
}

export class CreateGrupoComponentesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => CreateConfiguracionGrupoDto)
  componentes: CreateConfiguracionGrupoDto[];
}
