import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { digitsOnly, upperTrim } from '../../../common/transformers/normalize.transformers';
import { IsCpfOrCnpj } from '../../../common/validators/is-cpf-cnpj.validator';

export enum GatewayPersonType {
  PF = 'PF',
  PJ = 'PJ',
}

/**
 * Espelha o corpo exato esperado por POST /api/users do gateway Lera Box
 * (CreateUserDto no Swagger deles, https://api.branchpay.com.br/docs).
 * A resposta do gateway é só uma mensagem — documento, senha,
 * CodigoCliente e ChaveLoja chegam por e-mail, fora desse fluxo.
 *
 * document/phone/zipCode aceitam o que a pessoa naturalmente digita (com
 * pontuação — "123.456.789-01", "(11) 99999-8888", "01310-100") e são
 * normalizados para apenas dígitos antes de validar o tamanho e de
 * seguir para o gateway, que só aceita dígitos.
 */
export class RegisterGatewayDto {
  @ApiProperty({ enum: GatewayPersonType, example: 'PF' })
  @IsEnum(GatewayPersonType)
  personType: GatewayPersonType;

  @ApiProperty({ example: 'Maria Silva', description: 'Nome completo (PF) ou razão social (PJ)' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({
    example: 'Loja da Maria',
    description: 'Nome fantasia (recomendado para PJ)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  tradingName?: string;

  @ApiProperty({
    example: 'maria@empresa.com',
    description: 'E-mail real — recebe senha e notificações',
  })
  @IsEmail()
  @MaxLength(180)
  email: string;

  @ApiProperty({ example: '11999998888', description: 'Celular brasileiro válido com DDD' })
  @Transform(digitsOnly)
  @IsString()
  @MinLength(10)
  @MaxLength(11)
  phone: string;

  @ApiProperty({
    example: '12345678909',
    description:
      'CPF (11) ou CNPJ (14) — pode ser de uma entidade fictícia, mas precisa ter dígito verificador válido',
  })
  @Transform(digitsOnly)
  @IsString()
  @MinLength(11)
  @MaxLength(14)
  @IsCpfOrCnpj()
  document: string;

  @ApiProperty({ example: '01310100', description: 'CEP, com ou sem hífen' })
  @Transform(digitsOnly)
  @IsString()
  @MinLength(8)
  @MaxLength(8)
  zipCode: string;

  @ApiProperty({ example: 'Av. Paulista' })
  @IsString()
  @MaxLength(150)
  address: string;

  @ApiProperty({ example: '1000' })
  @IsString()
  @MaxLength(20)
  number: string;

  @ApiPropertyOptional({ example: 'Sala 12' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  complement?: string;

  @ApiProperty({ example: 'Bela Vista' })
  @IsString()
  @MaxLength(100)
  neighborhood: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiProperty({ example: 'SP', description: 'UF com 2 letras' })
  @Transform(upperTrim)
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  state: string;
}
