import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsString, MaxLength, MinLength } from 'class-validator';
import { digitsOnly } from '../../../common/transformers/normalize.transformers';
import { IsCpfOrCnpj } from '../../../common/validators/is-cpf-cnpj.validator';

/**
 * Corpo aceito pelo nosso POST /withdrawals.
 *
 * `document` é exigido pelo gateway (CreateWithdrawDto.document — CPF/CNPJ
 * do titular da chave Pix de destino, não da loja). Já tentamos substituir
 * isso pelo documento da própria loja (salvo em gateway_accounts) pra
 * simplificar o formulário, e o resultado foi todo saque sendo negado
 * (`denialReason: INVALID_DATA`) sempre que a chave Pix informada não
 * pertencia a esse CPF/CNPJ — o Pix valida que o documento bate com o
 * titular da chave, então isso só funcionava por acaso quando o titular
 * da chave era a própria loja.
 */
export class CreateWithdrawalDto {
  @ApiProperty({ example: 10000, description: 'Valor do saque em centavos' })
  @IsInt()
  @IsPositive()
  amountCents: number;

  @ApiProperty({ example: 'chave-pix@exemplo.com', description: 'Chave Pix de destino' })
  @IsString()
  @MinLength(5)
  @MaxLength(150)
  pixKey: string;

  @ApiProperty({
    example: '12345678900',
    description: 'CPF ou CNPJ do titular da chave Pix de destino (aceita com ou sem pontuação)',
  })
  @Transform(digitsOnly)
  @IsString()
  @IsCpfOrCnpj()
  document: string;

  @ApiPropertyOptional({ example: 'Saque para conta pessoal' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
