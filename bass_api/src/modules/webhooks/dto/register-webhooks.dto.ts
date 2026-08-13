import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUrl } from 'class-validator';

export class RegisterWebhooksDto {
  @ApiPropertyOptional({
    description:
      'URL pública desta API a usar no cadastro (sobrepõe PUBLIC_BASE_URL do .env só nesta chamada) — útil em dev pra trocar de túnel sem editar/reiniciar a API.',
    example: 'https://algo-aleatorio.trycloudflare.com/api',
  })
  @IsOptional()
  @IsUrl({ require_tld: false })
  publicBaseUrl?: string;
}
