import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import { CheckoutLinkStatus } from '../../../common/enums/domain.enums';

@Exclude()
export class CheckoutLinkResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty({ description: 'Identificador público usado na URL compartilhável (/pay/:slug)' })
  @Expose()
  slug: string;

  @ApiProperty({ example: 'PIX' })
  @Expose()
  @Transform(({ obj }) => String(obj.method).toUpperCase())
  method: string;

  @ApiProperty()
  @Expose()
  @Transform(({ obj }) => obj.amount)
  amountCents: number;

  @ApiPropertyOptional()
  @Expose()
  description: string | null;

  @ApiProperty()
  @Expose()
  externalReference: string;

  @ApiProperty({ enum: CheckoutLinkStatus })
  @Expose()
  status: CheckoutLinkStatus;

  @ApiPropertyOptional()
  @Expose()
  installments: number | null;

  @ApiPropertyOptional()
  @Expose()
  feePercent: string | null;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiPropertyOptional()
  @Expose()
  expiresAt: Date | null;
}
