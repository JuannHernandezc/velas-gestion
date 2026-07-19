import { Module } from '@nestjs/common';
import { ComponenteBaseService } from './componente-base.service';
import { ComponenteBaseController } from './componente-base.controller';

@Module({
  providers: [ComponenteBaseService],
  controllers: [ComponenteBaseController],
  exports: [ComponenteBaseService],
})
export class ComponenteBaseModule {}
