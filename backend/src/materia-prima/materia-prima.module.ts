import { Module } from '@nestjs/common';
import { MateriaPrimaService } from './materia-prima.service';
import { MateriaPrimaController } from './materia-prima.controller';

@Module({
  providers: [MateriaPrimaService],
  controllers: [MateriaPrimaController],
  exports: [MateriaPrimaService],
})
export class MateriaPrimaModule {}
