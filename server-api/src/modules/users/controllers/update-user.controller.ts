import { Body, Controller, Param, Patch, UseGuards, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiOkResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { JwtAccessGuard } from '../../../common/guards/jwt-access.guard';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../../common/strategies/jwt-access.strategy';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { UpdateUserSchema, UpdateUserDto } from '../dto/update-user.dto';
import { UpdateUserService } from '../services/update-user.service';

@ApiTags('Users')
@Controller('users')
export class UpdateUserController {
  constructor(private readonly updateUserService: UpdateUserService) {}

  @Patch(':id')
  @UseGuards(JwtAccessGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Atualiza dados de um usuário' })
  @ApiOkResponse({ description: 'Usuário atualizado' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  @UsePipes(new ZodValidationPipe(UpdateUserSchema))
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: JwtPayload) {
    return this.updateUserService.execute(id, dto, user);
  }
}
