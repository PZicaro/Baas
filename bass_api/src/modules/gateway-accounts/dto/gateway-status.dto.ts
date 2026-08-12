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
}
