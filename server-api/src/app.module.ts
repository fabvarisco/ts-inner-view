import { Module } from '@nestjs/common';
import { PrismaModule } from './infra/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { VirtualToursModule } from './modules/virtual-tours/virtual-tours.module';
import { PanoramasModule } from './modules/panoramas/panoramas.module';
import { HotspotsModule } from './modules/hotspots/hotspots.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, PropertiesModule, VirtualToursModule, PanoramasModule, HotspotsModule],
})
export class AppModule {}
