import { Module } from '@nestjs/common';
import { CreatePropertyController } from './controllers/create-property.controller';
import { ListPropertiesController } from './controllers/list-properties.controller';
import { FindPropertyController } from './controllers/find-property.controller';
import { CreatePropertyService } from './services/create-property.service';
import { ListPropertiesService } from './services/list-properties.service';
import { FindPropertyService } from './services/find-property.service';

@Module({
  controllers: [CreatePropertyController, ListPropertiesController, FindPropertyController],
  providers: [CreatePropertyService, ListPropertiesService, FindPropertyService],
})
export class PropertiesModule {}
