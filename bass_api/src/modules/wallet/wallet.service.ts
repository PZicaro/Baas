import { Injectable, Logger } from '@nestjs/common';
import { toUpstreamHttpException } from '../../common/http/upstream-error.util';
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
    try {
      return await this.gatewayAccountsService.withAuthenticatedClient(userId, async (client) => {
        const { data } = await client.get('/wallet');
        this.logger.log(`<- 200 /wallet resposta=${JSON.stringify(data)}`);
        return data;
      });
    } catch (error) {
      throw toUpstreamHttpException(this.logger, error, 'Falha ao consultar o saldo no gateway.');
    }
  }

  /** GET /api/wallet/transactions?status=&type=&limit= — extrato consolidado. */
  async getTransactions(userId: string, query: WalletTransactionsQuery): Promise<unknown> {
    try {
      return await this.gatewayAccountsService.withAuthenticatedClient(userId, async (client) => {
        const { data } = await client.get('/wallet/transactions', {
          params: {
            status: query.status || undefined,
            type: query.type || undefined,
            limit: query.limit ?? 50,
          },
        });
        this.logger.log(`<- 200 /wallet/transactions resposta=${JSON.stringify(data)}`);
        return data;
      });
    } catch (error) {
      throw toUpstreamHttpException(this.logger, error, 'Falha ao consultar o extrato no gateway.');
    }
  }
}
