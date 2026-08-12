import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { digitsOnly } from '../../../common/transformers/normalize.transformers';
import { IsCpfOrCnpj } from '../../../common/validators/is-cpf-cnpj.validator';

/**
 * Corpo enviado a POST /api/auth/login do gateway é só {document, password}.
 * email/phone são opcionais aqui e nunca vão pro gateway — servem só para
 * guardarmos localmente em GatewayAccount (para exibição), já que o
 * cadastro (que os coleta) e o login podem acontecer em momentos distintos.
 */
export class LoginGatewayDto {
  @ApiProperty({ example: '12345678000195', description: 'Aceita com ou sem pontuação' })
  @Transform(digitsOnly)
  @IsString()
  @MinLength(11)
  @MaxLength(14)
  @IsCpfOrCnpj()
  document: string;

  @ApiProperty({ description: 'Senha recebida por e-mail após o cadastro no gateway' })
  @IsString()
  @MinLength(1)
  password: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
