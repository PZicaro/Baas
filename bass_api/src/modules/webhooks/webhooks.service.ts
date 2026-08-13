import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import { WebhookEventType } from '../../common/enums/domain.enums';
import { verifyWebhookSignature } from '../../common/http/webhook-signature.util';
import { CheckoutLinksService } from '../checkout-links/checkout-links.service';
import { GatewayAccountsService } from '../gateway-accounts/gateway-accounts.service';
import { WithdrawalsService } from '../withdrawals/withdrawals.service';
import { WebhookEvent } from './entities/webhook-event.entity';

export type WebhookOutcome = 'processed' | 'duplicate' | 'not_found' | 'invalid_signature';

/** Resultado da localização do recurso (pedido ou saque) associado a um payload de webhook. */
type LocatedResource =
  | { kind: 'order'; userId: string; apply: (payload: Record<string, unknown>) => Promise<void> }
  | {
      kind: 'withdrawal';
      userId: string;
      apply: (payload: Record<string, unknown>) => Promise<void>;
    };

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(WebhookEvent)
    private readonly webhookEventsRepository: Repository<WebhookEvent>,
    private readonly gatewayAccountsService: GatewayAccountsService,
    private readonly checkoutLinksService: CheckoutLinksService,
    private readonly withdrawalsService: WithdrawalsService,
  ) {}

  /**
   * Recebe um callback do gateway já roteado por evento (o slug da URL —
   * ver WebhooksController — é quem determina o tipo, nunca o corpo, já
   * que cada evento tem sua própria URL cadastrada). Fluxo:
   *
   * 1. Idempotência: mesmo `externalEventId` já processado? não reaplica.
   * 2. Localiza o pedido/saque local (leitura) — é dali que vem o
   *    `userId` dono da conta, e é o segredo *dele* que valida a
   *    assinatura (cada lojista tem o seu, ver GatewayAccountsService).
   * 3. Se houver segredo cadastrado, exige assinatura válida.
   * 4. Aplica o status definitivo e audita tudo em `webhook_events`,
   *    sucesso ou falha.
   */
  async handle(
    eventType: WebhookEventType,
    rawBody: Buffer,
    payload: Record<string, unknown>,
    signatureHeader: string | undefined,
  ): Promise<WebhookOutcome> {
    const payloadHash = createHash('sha256').update(rawBody).digest('hex');
    // `transactionId` é o identificador real usado pelo gateway no corpo
    // do callback (confirmado em produção); `id`/`eventId` ficam como
    // fallback tolerante.
    const externalEventId = this.pick(payload, ['transactionId', 'id', 'eventId']);

    if (externalEventId) {
      const duplicate = await this.webhookEventsRepository.findOne({
        where: { eventType, externalEventId, processed: true },
      });
      if (duplicate) {
        this.logger.warn(
          `Webhook duplicado ignorado event=${eventType} externalEventId=${externalEventId}`,
        );
        await this.audit({
          eventType,
          externalEventId,
          payloadHash,
          signature: signatureHeader,
          signatureValid: null,
          payload,
          processed: true,
          error: 'Evento duplicado (idempotência) — não reaplicado.',
        });
        return 'duplicate';
      }
    }

    const resource = await this.locate(eventType, payload);
    if (!resource) {
      this.logger.warn(
        `Webhook sem correspondência local event=${eventType} payload=${JSON.stringify(payload)}`,
      );
      await this.audit({
        eventType,
        externalEventId,
        payloadHash,
        signature: signatureHeader,
        signatureValid: null,
        payload,
        processed: false,
        error: 'Nenhum pedido/saque local corresponde a este payload.',
      });
      return 'not_found';
    }

    // Só exigimos assinatura quando o lojista tem um segredo cadastrado —
    // espelha exatamente "validar quando houver secret".
    const secret = await this.gatewayAccountsService.getWebhookSecret(resource.userId);
    const signatureValid = secret ? verifyWebhookSignature(rawBody, secret, signatureHeader) : null;

    if (secret && !signatureValid) {
      this.logger.warn(
        `Assinatura inválida em webhook event=${eventType} userId=${resource.userId}`,
      );
      await this.audit({
        eventType,
        externalEventId,
        payloadHash,
        signature: signatureHeader,
        signatureValid: false,
        payload,
        processed: false,
        error: 'Assinatura X-Lera-Box-Signature inválida.',
      });
      return 'invalid_signature';
    }

    await resource.apply(payload);
    await this.audit({
      eventType,
      externalEventId,
      payloadHash,
      signature: signatureHeader,
      signatureValid,
      payload,
      processed: true,
      error: null,
    });
    return 'processed';
  }

  private async locate(
    eventType: WebhookEventType,
    payload: Record<string, unknown>,
  ): Promise<LocatedResource | null> {
    if (eventType === WebhookEventType.WITHDRAWAL) {
      const withdrawal = await this.withdrawalsService.findWithdrawalForWebhook(payload);
      if (!withdrawal) return null;
      return {
        kind: 'withdrawal',
        userId: withdrawal.userId,
        apply: (p) =>
          this.withdrawalsService.applyWithdrawalWebhook(withdrawal, p).then(() => undefined),
      };
    }

    const order = await this.checkoutLinksService.findOrderForWebhook(payload);
    if (!order) return null;
    return {
      kind: 'order',
      userId: order.userId,
      apply: (p) => this.checkoutLinksService.applyPaymentWebhook(order, p).then(() => undefined),
    };
  }

  private async audit(entry: {
    eventType: WebhookEventType;
    externalEventId: string | null;
    payloadHash: string;
    signature: string | undefined;
    signatureValid: boolean | null;
    payload: Record<string, unknown>;
    processed: boolean;
    error: string | null;
  }): Promise<void> {
    const event = this.webhookEventsRepository.create({
      eventType: entry.eventType,
      externalEventId: entry.externalEventId,
      payloadHash: entry.payloadHash,
      signature: entry.signature ?? null,
      signatureValid: entry.signatureValid,
      payload: entry.payload,
      processed: entry.processed,
      processedAt: entry.processed ? new Date() : null,
      error: entry.error,
    });
    await this.webhookEventsRepository.save(event);
  }

  /** Aceita string ou number nas chaves candidatas. */
  private pick(payload: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = payload?.[key];
      if (typeof value === 'string' && value.length > 0) return value;
      if (typeof value === 'number' && !Number.isNaN(value)) return String(value);
    }
    return null;
  }
}
