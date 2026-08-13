import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { digitsOnly } from '../../../common/transformers/normalize.transformers';
import { IsCpfOrCnpj } from '../../../common/validators/is-cpf-cnpj.validator';

/**
 * Espelha o corpo de POST /api/auth/reset-password do gateway (rota
 * pública lá): documento + e-mail precisam bater com o cadastro. A nova
 * senha é enviada por e-mail — o gateway não devolve nada sensível aqui.
 */
export class ResetGatewayPasswordDto {
  @ApiProperty({ example: '12345678901' })
  @Transform(digitsOnly)
  @IsString()
  @MinLength(11)
  @MaxLength(14)
  @IsCpfOrCnpj()
  document: string;

  @ApiProperty({ example: 'maria@empresa.com' })
  @IsEmail()
  @MaxLength(180)
  email: string;
}
