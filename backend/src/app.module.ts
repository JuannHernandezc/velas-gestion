import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MateriaPrimaModule } from './materia-prima/materia-prima.module';
import { ComponenteBaseModule } from './componente-base/componente-base.module';
import { CatalogoModule } from './catalogo/catalogo.module';
import { PedidoModule } from './pedido/pedido.module';
import { FacturaModule } from './factura/factura.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MateriaPrimaModule,
    ComponenteBaseModule,
    CatalogoModule,
    PedidoModule,
    FacturaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
