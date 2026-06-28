import { Body, Controller, Post, UseGuards, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAccessGuard } from '../../../common/guards/jwt-access.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../../common/strategies/jwt-access.strategy';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { CreatePropertySchema, CreatePropertyDto } from '../dto/create-property.dto';
import { CreatePropertyService } from '../services/create-property.service';

@ApiTags('Properties')
@Controller('properties')
export class CreatePropertyController {
  constructor(private readonly createPropertyService: CreatePropertyService) {}

  @Post()
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cria um novo imóvel' })
  @ApiCreatedResponse({ description: 'Imóvel criado' })
  @UsePipes(new ZodValidationPipe(CreatePropertySchema))
  create(@Body() dto: CreatePropertyDto, @CurrentUser() user: JwtPayload) {
    return this.createPropertyService.execute(dto, user);
  }
}
