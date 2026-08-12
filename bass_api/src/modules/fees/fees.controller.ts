import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FeesService, GatewayFee } from './fees.service';

/**
 * Público de propósito: o GET /api/fees do próprio gateway é público, e a
 * página de pagamento do pagador (sem sessão do BaaS) também precisa dele
 * pra montar o resumo de taxas antes de pagar com cartão.
 */
@ApiTags('fees')
@Controller('fees')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Get()
  @ApiOperation({ summary: 'Tabela de taxas de cartão (proxy de GET /api/fees do gateway)' })
  @ApiQuery({ name: 'brand', required: false, enum: ['VISA', 'MASTERCARD', 'ELO'] })
  list(@Query('brand') brand?: string): Promise<GatewayFee[]> {
    return this.feesService.list(brand);
  }
}
