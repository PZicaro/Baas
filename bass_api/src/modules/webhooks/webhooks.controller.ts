import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  RawBodyRequest,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WEBHOOK_EVENT_SLUGS, WebhookEventType } from '../../common/enums/domain.enums';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GatewayAccountsService } from '../gateway-accounts/gateway-accounts.service';
import { User } from '../users/entities/user.entity';
import { RegisterWebhooksDto } from './dto/register-webhooks.dto';
import { WebhooksService } from './webhooks.service';

const SLUG_TO_EVENT: Record<string, WebhookEventType> = Object.fromEntries(
  Object.entries(WEBHOOK_EVENT_SLUGS).map(([event, slug]) => [slug, event as WebhookEventType]),
);

/**
 * Área do lojista (autenticada): cadastra/recadastra os 3 webhooks no
 * gateway sob demanda — sem precisar relogar em POST /gateway-accounts/connect.
 * Útil em dev pra atualizar a URL depois de trocar de túnel.
 */
@ApiTags('webhooks')
@ApiCookieAuth()
@UseGuards(JwtAuthGuard)
@Controller('webhooks')
export class WebhooksAdminController {
  constructor(private readonly gatewayAccountsService: GatewayAccountsService) {}

  @Post('register')
  @ApiOperation({
    summary:
      'Cadastra/recadastra no gateway os 3 webhooks (PAYMENT_PIX, PAYMENT_CARD, WITHDRAWAL) da loja logada',
  })
  async register(
    @CurrentUser() user: User,
    @Body() dto: RegisterWebhooksDto,
  ): Promise<{ message: string; webhooks: Array<{ event: string; url: string; ok: boolean }> }> {
    const webhooks = await this.gatewayAccountsService.registerWebhooksForUser(
      user.id,
      dto.publicBaseUrl,
    );
    const allOk = webhooks.every((w) => w.ok);
    return {
      message: allOk
        ? 'Webhooks cadastrados com sucesso no gateway.'
        : 'Alguns webhooks falharam ao cadastrar — veja os logs da API.',
      webhooks,
    };
  }
}

/**
 * Receptor dos callbacks assíncronos do gateway Lera Box. Uma URL por
 * evento (cadastradas por WebhooksAdminController/GatewayAccountsService),
 * sem `JwtAuthGuard` — quem chama aqui é o gateway, não um usuário logado
 * na BaaS. A "autenticação" desse endpoint é a assinatura HMAC (ver
 * WebhooksService), não o cookie de sessão.
 */
@ApiTags('webhooks')
@Controller('webhooks/lera-box')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post(':slug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Callback do gateway Lera Box (PAYMENT_PIX, PAYMENT_CARD ou WITHDRAWAL)',
  })
  @ApiParam({ name: 'slug', enum: Object.values(WEBHOOK_EVENT_SLUGS) })
  async receive(
    @Param('slug') slug: string,
    @Req() req: RawBodyRequest<Request>,
  ): Promise<{ received: true; outcome: string }> {
    const eventType = SLUG_TO_EVENT[slug];
    if (!eventType) {
      throw new NotFoundException('Evento de webhook desconhecido.');
    }

    const payload = (req.body ?? {}) as Record<string, unknown>;
    // `rawBody` só falta se o corpo veio vazio ou com content-type que o
    // parser padrão do Nest não reconhece como JSON — nesses casos o
    // fallback ainda garante um HMAC computável (vai só divergir do
    // enviado, o que é o comportamento correto: falha a verificação em
    // vez de quebrar a requisição).
    const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(payload));
    const signatureHeader = req.headers['x-lera-box-signature'];

    const outcome = await this.webhooksService.handle(
      eventType,
      rawBody,
      payload,
      typeof signatureHeader === 'string' ? signatureHeader : undefined,
    );

    if (outcome === 'invalid_signature') {
      throw new UnauthorizedException('Assinatura X-Lera-Box-Signature inválida.');
    }

    return { received: true, outcome };
  }
}
