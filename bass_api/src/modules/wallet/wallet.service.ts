import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { GatewayAccountsService } from '../gateway-accounts/gateway-accounts.service';

export interface WalletTransactionsQuery {
  status?: string;
  type?: string;
  limit?: number;
}

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private readonly gatewayAccountsService: GatewayAccountsService) {}

  /** GET /api/wallet — saldo (em centavos) da loja no gateway. */
  async getBalance(userId: string): Promise<unknown> {
    const client = await this.gatewayAccountsService.getAuthenticatedClient(userId);
    try {
      const { data } = await client.get('/wallet');
      this.logger.log(`<- 200 /wallet resposta=${JSON.stringify(data)}`);
      return data;
    } catch (error) {
      throw this.toHttpException(error, 'Falha ao consultar o saldo no gateway.');
    }
  }

  /** GET /api/wallet/transactions?status=&type=&limit= — extrato consolidado. */
  async getTransactions(userId: string, query: WalletTransactionsQuery): Promise<unknown> {
    const client = await this.gatewayAccountsService.getAuthenticatedClient(userId);
    try {
      const { data } = await client.get('/wallet/transactions', {
        params: {
          status: query.status || undefined,
          type: query.type || undefined,
          limit: query.limit ?? 50,
        },
      });
      this.logger.log(`<- 200 /wallet/transactions resposta=${JSON.stringify(data)}`);
      return data;
    } catch (error) {
      throw this.toHttpException(error, 'Falha ao consultar o extrato no gateway.');
    }
  }

  private toHttpException(error: unknown, fallback: string): HttpException {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? HttpStatus.BAD_GATEWAY;
      const body = error.response?.data;
      this.logger.error(
        `<- ${status} código=${error.code ?? '-'} resposta=${JSON.stringify(body)}`,
      );
      const message = (body as { message?: string })?.message ?? fallback;
      return new HttpException(message, status);
    }
    this.logger.error(fallback, error instanceof Error ? error.stack : String(error));
    return new HttpException(fallback, HttpStatus.BAD_GATEWAY);
  }
}
