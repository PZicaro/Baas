import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { OrderStatus, TransactionType } from '../../../common/enums/domain.enums';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Espelho local das movimentações relevantes do extrato do gateway
 * (GET /api/wallet/transactions), usado para conciliação por
 * externalReference e para servir o extrato consolidado ao lojista sem
 * depender de uma chamada síncrona ao gateway a cada consulta.
 *
 * Valores monetários sempre em centavos.
 */
@Entity('transactions')
export class Transaction extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index()
  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  @ManyToOne(() => Order, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'order_id' })
  order: Order | null;

  @Column({ name: 'order_id', type: 'varchar', length: 36, nullable: true })
  orderId: string | null;

  /** Id da transação no gateway (idempotência da sincronização). */
  @Index({ unique: true })
  @Column({ name: 'gateway_transaction_id', length: 100 })
  gatewayTransactionId: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'enum', enum: OrderStatus })
  status: OrderStatus;

  @Column({ type: 'int' })
  amount: number;

  @Index()
  @Column({ name: 'external_reference', type: 'varchar', length: 100, nullable: true })
  externalReference: string | null;

  /** Payload bruto retornado pelo gateway para essa movimentação. */
  @Column({ name: 'raw_payload', type: 'json', nullable: true })
  rawPayload: Record<string, unknown> | null;

  @Column({ name: 'occurred_at', type: 'datetime', nullable: true })
  occurredAt: Date | null;
}
