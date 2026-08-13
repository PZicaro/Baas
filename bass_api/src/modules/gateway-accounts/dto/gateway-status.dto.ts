import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GatewayStatusDto {
  @ApiProperty({ description: 'true se o lojista já autenticou e tem um token válido salvo' })
  connected: boolean;

  @ApiPropertyOptional()
  codigoCliente?: string | null;

  @ApiPropertyOptional()
  gatewayEmail?: string | null;

  @ApiPropertyOptional()
  active?: boolean;

  @ApiPropertyOptional({
    description:
      'true se os 3 webhooks (PAYMENT_PIX, PAYMENT_CARD, WITHDRAWAL) foram cadastrados com sucesso no gateway nesta conexão',
  })
  webhooksRegistered?: boolean;
}
