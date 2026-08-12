import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsString, Max, Min, MinLength } from 'class-validator';
import { digitsOnly } from '../../../common/transformers/normalize.transformers';

/** Espelha CreateCardPaymentDto do gateway (menos amount/description/externalReference, que vêm do link). */
export class PayCardDto {
  @ApiProperty({ enum: ['VISA', 'MASTERCARD', 'ELO'], example: 'VISA' })
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsIn(['VISA', 'MASTERCARD', 'ELO'])
  brand: string;

  @ApiProperty({ example: 1, minimum: 1, maximum: 21 })
  @IsInt()
  @Min(1)
  @Max(21)
  installments: number;

  @ApiProperty({ example: '4111111111111111' })
  @Transform(digitsOnly)
  @IsString()
  @MinLength(13)
  cardNumber: string;

  @ApiProperty({ example: 'MARIA SILVA' })
  @IsString()
  @MinLength(2)
  cardHolder: string;

  @ApiProperty({ example: '12' })
  @IsString()
  expiryMonth: string;

  @ApiProperty({ example: '2030' })
  @IsString()
  expiryYear: string;

  @ApiProperty({ example: '123' })
  @IsString()
  @MinLength(3)
  cvv: string;
}
