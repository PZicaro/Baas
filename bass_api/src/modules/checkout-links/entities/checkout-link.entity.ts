import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CheckoutLinkStatus, PaymentMethod } from '../../../common/enums/domain.enums';
import { User } from '../../users/entities/user.entity';

/**
 * Link/sessão de checkout criado pelo lojista, com identificador próprio
 * (id/slug) e `externalReference` conciliável com o gateway. Um link pode
 * originar mais de um pedido (Order) — por exemplo, uma nova tentativa após
 * expiração — mas representa uma única "oferta" de cobrança.
 *
 * Valores monetários sempre em centavos.
 */
@Entity('checkout_links')
export class CheckoutLink extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index()
  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  /** Slug curto e único usado na URL pública do link de pagamento. */
  @Index({ unique: true })
  @Column({ length: 40 })
  slug: string;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({ name: 'payer_name', type: 'varchar', length: 150, nullable: true })
  payerName: string | null;

  @Column({ name: 'payer_email', type: 'varchar', length: 180, nullable: true })
  payerEmail: string | null;

  @Column({ name: 'payer_phone', type: 'varchar', length: 20, nullable: true })
  payerPhone: string | null;

  /** Parcelas escolhidas (apenas para method = card). */
  @Column({ type: 'int', nullable: true })
  installments: number | null;

  /** Taxa consultada em GET /api/fees e persistida no momento da criação. */
  @Column({ name: 'fee_percent', type: 'decimal', precision: 5, scale: 2, nullable: true })
  feePercent: string | null;

  /** Referência própria do BaaS, usada como base do externalReference no gateway. */
  @Index({ unique: true })
  @Column({ name: 'external_reference', length: 100 })
  externalReference: string;

  @Column({ type: 'enum', enum: CheckoutLinkStatus, default: CheckoutLinkStatus.ACTIVE })
  status: CheckoutLinkStatus;

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expiresAt: Date | null;
}
