import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { WithdrawalStatus } from '../../../common/enums/domain.enums';
import { User } from '../../users/entities/user.entity';

/**
 * Solicitação de saque (POST /api/withdrawals) para chave Pix ou conta
 * bancária, com acompanhamento de status via GET /api/withdrawals/:id.
 *
 * Valores monetários sempre em centavos.
 */
@Entity('withdrawals')
export class Withdrawal extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index()
  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  @Index({ unique: true })
  @Column({ name: 'gateway_withdrawal_id', type: 'varchar', length: 100, nullable: true })
  gatewayWithdrawalId: string | null;

  @Column({ type: 'int' })
  amount: number;

  /** Chave Pix de destino (quando o saque for via Pix). */
  @Column({ name: 'pix_key', type: 'varchar', length: 150, nullable: true })
  pixKey: string | null;

  /** Dados da conta de destino quando o saque não for via chave Pix. */
  @Column({ name: 'destination_account', type: 'json', nullable: true })
  destinationAccount: Record<string, unknown> | null;

  @Column({ type: 'enum', enum: WithdrawalStatus, default: WithdrawalStatus.PENDING })
  status: WithdrawalStatus;

  @Column({ name: 'requested_at', type: 'datetime' })
  requestedAt: Date;

  @Column({ name: 'processed_at', type: 'datetime', nullable: true })
  processedAt: Date | null;

  /** Resposta bruta mais recente do gateway para essa solicitação. */
  @Column({ name: 'raw_response', type: 'json', nullable: true })
  rawResponse: Record<string, unknown> | null;
}
