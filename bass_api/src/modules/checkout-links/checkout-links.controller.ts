import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CheckoutLinksService } from './checkout-links.service';
import { CheckoutLinkResponseDto } from './dto/checkout-link-response.dto';
import { CreateCheckoutLinkDto } from './dto/create-checkout-link.dto';

/**
 * Área do lojista (autenticada): criar e listar links, acompanhar o status.
 * A cobrança em si (Pix/cartão) acontece na página pública que o pagador
 * abre a partir do link — ver CheckoutPublicController (/checkout/pay/:slug).
 */
@ApiTags('checkout-links')
@ApiCookieAuth()
@UseGuards(JwtAuthGuard)
@Controller('checkout/links')
export class CheckoutLinksController {
  constructor(private readonly checkoutLinksService: CheckoutLinksService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo link/sessão de checkout' })
  @ApiCreatedResponse({ type: CheckoutLinkResponseDto })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateCheckoutLinkDto,
  ): Promise<CheckoutLinkResponseDto> {
    const link = await this.checkoutLinksService.create(user.id, dto);
    return plainToInstance(CheckoutLinkResponseDto, link);
  }

  @Get()
  @ApiOperation({ summary: 'Lista os links de checkout do lojista logado' })
  @ApiOkResponse({ type: CheckoutLinkResponseDto, isArray: true })
  async findAll(@CurrentUser() user: User): Promise<CheckoutLinkResponseDto[]> {
    const links = await this.checkoutLinksService.findAllForUser(user.id);
    return links.map((link) => plainToInstance(CheckoutLinkResponseDto, link));
  }

  @Get(':id/status')
  @ApiOperation({
    summary:
      'Consulta o status atual do pagamento no gateway (GET /api/payments/:id) e atualiza local',
  })
  async checkStatus(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.checkoutLinksService.checkStatusOwned(user.id, id);
  }
}
