import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import { WithdrawalStatus } from '../../../common/enums/domain.enums';

@Exclude()
export class WithdrawalResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  @Transform(({ obj }) => obj.amount)
  amountCents: number;

  @ApiPropertyOptional()
  @Expose()
  pixKey: string | null;

  @ApiProperty({ enum: WithdrawalStatus })
  @Expose()
  status: WithdrawalStatus;

  @ApiPropertyOptional({
    description:
      'Motivo devolvido pelo gateway quando o saque é negado (ex.: "Transação negada: dados inválidos").',
  })
  @Expose()
  @Transform(({ obj }) =>
    obj.status === WithdrawalStatus.DENIED ? (obj.rawResponse?.message ?? null) : null,
  )
  gatewayMessage: string | null;

  @ApiProperty()
  @Expose()
  requestedAt: Date;

  @ApiPropertyOptional()
  @Expose()
  processedAt: Date | null;

  @ApiProperty()
  @Expose()
  createdAt: Date;
}
