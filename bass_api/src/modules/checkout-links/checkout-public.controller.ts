import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { CheckoutLinksService } from './checkout-links.service';
import { CheckoutLinkResponseDto } from './dto/checkout-link-response.dto';
import { PayCardDto } from './dto/pay-card.dto';

/**
 * Rotas públicas (sem sessão do BaaS) usadas pela página de pagamento que o
 * pagador abre a partir do link compartilhado — /pay/:slug no frontend.
 * A identidade de quem recebe (e qual token do gateway usar) vem do próprio
 * link, nunca de quem está fazendo a requisição.
 */
@ApiTags('checkout-public')
@Controller('checkout/pay')
export class CheckoutPublicController {
  constructor(private readonly checkoutLinksService: CheckoutLinksService) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Detalhes públicos do link de pagamento (para a página do pagador)' })
  @ApiOkResponse({ type: CheckoutLinkResponseDto })
  async get(@Param('slug') slug: string): Promise<CheckoutLinkResponseDto> {
    const link = await this.checkoutLinksService.findBySlug(slug);
    return plainToInstance(CheckoutLinkResponseDto, link);
  }

  @Post(':slug/pix')
  @ApiOperation({ summary: 'Gera a cobrança Pix para o pagador (POST /api/payments/pix)' })
  async generatePix(@Param('slug') slug: string) {
    return this.checkoutLinksService.generatePixBySlug(slug);
  }

  @Post(':slug/card')
  @ApiOperation({ summary: 'Processa o pagamento de cartão do pagador (POST /api/payments/card)' })
  async payCard(@Param('slug') slug: string, @Body() dto: PayCardDto) {
    return this.checkoutLinksService.payCardBySlug(slug, dto);
  }

  @Get(':slug/status')
  @ApiOperation({ summary: 'Consulta o status atual do pagamento (GET /api/payments/:id)' })
  async status(@Param('slug') slug: string) {
    return this.checkoutLinksService.checkStatusBySlug(slug);
  }
}
