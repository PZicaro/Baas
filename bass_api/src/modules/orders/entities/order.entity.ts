import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { OrderStatus, PaymentMethod } from '../../../common/enums/domain.enums';
import { CheckoutLink } from '../../checkout-links/entities/checkout-link.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Pedido: uma tentativa concreta de cobrança originada de um CheckoutLink,
 * espelhando o pagamento criado no gateway (POST /api/payments/pix ou
 * /api/payments/card) e seu estado de processamento até a confirmação
 * (síncrona ou via webhook).
 *
 * Valores monetários sempre em centavos.
 */
@Entity('orders')
export class Order extends BaseEntity {
  @ManyToOne(() => CheckoutLink, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'checkout_link_id' })
  checkoutLink: CheckoutLink;

  @Index()
  @Column({ name: 'checkout_link_id' })
  checkoutLinkId: string;

  /** Owner denormalizado para consultas rápidas e isolamento por conta. */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'int', nullable: true })
  installments: number | null;

  @Column({ name: 'fee_percent', type: 'decimal', precision: 5, scale: 2, nullable: true })
  feePercent: string | null;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  /** Referência enviada ao gateway (externalReference) para conciliação. */
  @Index()
  @Column({ name: 'external_reference', length: 100 })
  externalReference: string;

  /** Id do pagamento retornado pelo gateway. */
  @Index()
  @Column({ name: 'gateway_payment_id', length: 100, nullable: true })
  gatewayPaymentId: string | null;

  /** txid retornado pelo gateway para pagamentos Pix. */
  @Column({ name: 'gateway_txid', length: 100, nullable: true })
  gatewayTxid: string | null;

  @Column({ name: 'qr_code_base64', type: 'longtext', nullable: true })
  qrCodeBase64: string | null;

  @Column({ type: 'text', nullable: true })
  emv: string | null;

  /** Corpo bruto retornado pelo gateway ao criar o pagamento (auditoria). */
  @Column({ name: 'raw_response', type: 'json', nullable: true })
  rawResponse: Record<string, unknown> | null;

  @Column({ name: 'paid_at', type: 'datetime', nullable: true })
  paidAt: Date | null;
}
