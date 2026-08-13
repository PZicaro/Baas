import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { GatewayStatusDto } from './dto/gateway-status.dto';
import { LoginGatewayDto } from './dto/login-gateway.dto';
import { RegisterGatewayDto } from './dto/register-gateway.dto';
import { ResetGatewayPasswordDto } from './dto/reset-gateway-password.dto';
import { GatewayAccountsService } from './gateway-accounts.service';

@ApiTags('gateway')
@ApiCookieAuth()
@UseGuards(JwtAuthGuard)
@Controller('gateway')
export class GatewayAccountsController {
  private readonly logger = new Logger(GatewayAccountsController.name);

  constructor(private readonly gatewayAccountsService: GatewayAccountsService) {}

  @Post('register')
  @ApiOperation({ summary: 'Cadastra a loja no gateway Lera Box (proxy de POST /api/users)' })
  register(
    @CurrentUser() user: User,
    @Body() dto: RegisterGatewayDto,
  ): Promise<{ message: string }> {
    return this.gatewayAccountsService.registerAtGateway(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autentica no gateway e vincula/atualiza a conta do lojista logado' })
  @ApiOkResponse({ type: GatewayStatusDto })
  connect(@CurrentUser() user: User, @Body() dto: LoginGatewayDto): Promise<GatewayStatusDto> {
    this.logger.log(`POST /gateway/login chamado por user=${user.id} document=${dto.document}`);
    return this.gatewayAccountsService.connect(user.id, dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicita reset de senha no gateway (proxy de POST /api/auth/reset-password)',
  })
  resetPassword(@Body() dto: ResetGatewayPasswordDto): Promise<{ message: string }> {
    return this.gatewayAccountsService.resetPasswordAtGateway(dto);
  }

  @Get('status')
  @ApiOperation({ summary: 'Indica se o lojista logado já está conectado ao gateway' })
  @ApiOkResponse({ type: GatewayStatusDto })
  status(@CurrentUser() user: User): Promise<GatewayStatusDto> {
    return this.gatewayAccountsService.getStatus(user.id);
  }
}
