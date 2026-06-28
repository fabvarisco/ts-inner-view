import { Body, Controller, Post, UseGuards, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiCreatedResponse, ApiConflictResponse } from '@nestjs/swagger';
import { JwtAccessGuard } from '../../../common/guards/jwt-access.guard';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../../common/strategies/jwt-access.strategy';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { CreateUserSchema, CreateUserDto } from '../dto/create-user.dto';
import { CreateUserService } from '../services/create-user.service';

@ApiTags('Users')
@Controller('users')
export class CreateUserController {
  constructor(private readonly createUserService: CreateUserService) {}

  @Post()
  @UseGuards(JwtAccessGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cria um novo usuário na imobiliária' })
  @ApiCreatedResponse({ description: 'Usuário criado' })
  @ApiConflictResponse({ description: 'Email já em uso' })
  @UsePipes(new ZodValidationPipe(CreateUserSchema))
  create(@Body() dto: CreateUserDto, @CurrentUser() user: JwtPayload) {
    return this.createUserService.execute(dto, user);
  }
}
