import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { digitsOnly } from '../../../common/transformers/normalize.transformers';
import { IsCpfOrCnpj } from '../../../common/validators/is-cpf-cnpj.validator';
import { PaymentMethod } from '../../../common/enums/domain.enums';

export class CreateCheckoutLinkDto {
  @ApiProperty({
    enum: PaymentMethod,
    example: 'pix',
    description: 'Aceita PIX/CARD em qualquer caixa',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
  @IsIn([PaymentMethod.PIX, PaymentMethod.CARD])
  method: PaymentMethod;

  @ApiProperty({ example: 15000, description: 'Valor em centavos' })
  @IsInt()
  @IsPositive()
  amountCents: number;

  @ApiPropertyOptional({ example: 'Pedido #123' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  payerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(180)
  payerEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  payerPhone?: string;

  @ApiPropertyOptional({
    description: 'Obrigatório quando method=pix (CreatePixPaymentDto.payerDocument no gateway)',
  })
  @ValidateIf((dto: CreateCheckoutLinkDto) => dto.method === PaymentMethod.PIX)
  @Transform(digitsOnly)
  @IsString()
  @IsCpfOrCnpj()
  payerDocument?: string;
}
