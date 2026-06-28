import { Controller, Get, Param } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindPropertyService } from '../services/find-property.service';

@ApiTags('Properties')
@Controller('properties')
export class FindPropertyController {
  constructor(private readonly findPropertyService: FindPropertyService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Busca um imóvel pelo ID' })
  @ApiOkResponse({ description: 'Detalhes do imóvel' })
  @ApiNotFoundResponse({ description: 'Imóvel não encontrado' })
  findOne(@Param('id') id: string) {
    return this.findPropertyService.execute(id);
  }
}
