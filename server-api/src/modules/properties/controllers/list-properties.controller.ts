import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { ListPropertiesSchema, ListPropertiesDto } from '../dto/list-properties.dto';
import { ListPropertiesService } from '../services/list-properties.service';

@ApiTags('Properties')
@Controller('properties')
export class ListPropertiesController {
  constructor(private readonly listPropertiesService: ListPropertiesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista imóveis disponíveis com filtros' })
  @ApiOkResponse({ description: 'Lista paginada de imóveis' })
  findAll(@Query(new ZodValidationPipe(ListPropertiesSchema)) query: ListPropertiesDto) {
    return this.listPropertiesService.execute(query);
  }
}
