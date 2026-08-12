import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

/** Bandeiras aceitas por GET /api/fees do gateway. */
export type CardBrand = 'VISA' | 'MASTERCARD' | 'ELO';

export interface GatewayFee {
  brand?: string;
  bandeira?: string;
  installments?: number;
  parcelas?: number;
  feePercent?: number;
  fee?: number;
  taxa?: number;
  [key: string]: unknown;
}

@Injectable()
export class FeesService {
  private readonly logger = new Logger(FeesService.name);
  private readonly http: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.http = axios.create({
      baseURL: this.configService.get<string>('gateway.baseUrl'),
      timeout: 15_000,
    });
  }

  /** GET /api/fees (público no gateway) — repassa a tabela de taxas de cartão. */
  async list(brand?: string): Promise<GatewayFee[]> {
    try {
      const { data } = await this.http.get('/fees', { params: brand ? { brand } : undefined });
      const list: unknown = Array.isArray(data) ? data : (data?.data ?? data?.fees ?? []);
      return Array.isArray(list) ? (list as GatewayFee[]) : [];
    } catch (error) {
      this.logger.error(
        'Falha ao consultar GET /fees no gateway',
        error instanceof Error ? error.stack : undefined,
      );
      throw new HttpException('Falha ao consultar as taxas no gateway.', HttpStatus.BAD_GATEWAY);
    }
  }

  /**
   * Encontra a taxa exata (feePercent) pra uma bandeira + número de parcelas,
   * pra montar POST /payments/card com o valor certo (nunca inventado
   * localmente — "rejeitar ou evitar o envio de feePercent divergente").
   */
  async findFeePercent(brand: string, installments: number): Promise<number> {
    const fees = await this.list(brand);
    const match = fees.find((fee) => {
      const feeInstallments = fee.installments ?? fee.parcelas;
      const feeBrand = (fee.brand ?? fee.bandeira ?? '').toString().toUpperCase();
      return Number(feeInstallments) === installments && feeBrand === brand.toUpperCase();
    });
    const feePercent = match?.feePercent ?? match?.fee ?? match?.taxa;
    if (feePercent === undefined || feePercent === null || Number.isNaN(Number(feePercent))) {
      throw new HttpException(
        `Taxa não encontrada para ${brand} em ${installments}x. Consulte GET /fees.`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    return Number(feePercent);
  }
}
