import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { WebhookEventType } from '../../../common/enums/domain.enums';

/**
 * Auditoria e controle de idempotência dos callbacks recebidos do gateway
 * (PAYMENT_PIX, PAYMENT_CARD, WITHDRAWAL). Todo payload recebido é
 * registrado aqui antes de ser processado, permitindo reprocessar eventos
 * com falha e evitar processar o mesmo evento duas vezes.
 */
@Entity('webhook_events')
export class WebhookEvent extends BaseEntity {
  @Column({ name: 'event_type', type: 'enum', enum: WebhookEventType })
  eventType: WebhookEventType;

  /** Id do evento/recurso no gateway, quando informado (chave de idempotência). */
  @Index()
  @Column({ name: 'external_event_id', length: 150, nullable: true })
  externalEventId: string | null;

  /** Hash do corpo bruto, usado como fallback de idempotência sem external_event_id. */
  @Index()
  @Column({ name: 'payload_hash', length: 64 })
  payloadHash: string;

  /** Conteúdo de X-Lera-Box-Signature recebido no header, quando houver. */
  @Column({ length: 255, nullable: true })
  signature: string | null;

  @Column({ name: 'signature_valid', type: 'boolean', nullable: true })
  signatureValid: boolean | null;

  /** Corpo bruto recebido do gateway. */
  @Column({ type: 'json' })
  payload: Record<string, unknown>;

  @Column({ default: false })
  processed: boolean;

  @Column({ name: 'processed_at', type: 'datetime', nullable: true })
  processedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  error: string | null;
}
