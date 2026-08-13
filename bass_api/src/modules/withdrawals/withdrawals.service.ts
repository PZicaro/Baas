import { HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WithdrawalStatus } from '../../common/enums/domain.enums';
import { toUpstreamHttpException } from '../../common/http/upstream-error.util';
import { GatewayAccountsService } from '../gateway-accounts/gateway-accounts.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { Withdrawal } from './entities/withdrawal.entity';

@Injectable()
export class WithdrawalsService {
  private readonly logger = new Logger(WithdrawalsService.name);

  constructor(
    @InjectRepository(Withdrawal)
    private readonly withdrawalsRepository: Repository<Withdrawal>,
    private readonly gatewayAccountsService: GatewayAccountsService,
  ) {}

  /** Solicita o saque (POST /api/withdrawals) e persiste localmente. */
  async create(userId: string, dto: CreateWithdrawalDto): Promise<Withdrawal> {
    const payload = {
      amount: dto.amountCents,
      pixKey: dto.pixKey,
      description: dto.description ?? undefined,
      // CPF/CNPJ do titular da chave Pix de destino — não o documento da
      // loja (ver comentário no DTO: já causou negação de 100% dos saques).
      document: dto.document,
    };
    this.logger.log(`-> POST /withdrawals payload=${JSON.stringify(payload)}`);

    let data: Record<string, unknown>;
    try {
      data = await this.gatewayAccountsService.withAuthenticatedClient(userId, async (client) => {
        const response = await client.post('/withdrawals', payload);
        this.logger.log(`<- 201 /withdrawals resposta=${JSON.stringify(response.data)}`);
        return response.data;
      });
    } catch (error) {
      throw toUpstreamHttpException(this.logger, error, 'Falha ao solicitar o saque no gateway.');
    }

    // O gateway já responde com o status definitivo de forma síncrona (às
    // vezes DENIED na hora, por dados inválidos) — refletir isso direto na
    // criação, em vez de gravar sempre PENDING e só corrigir depois numa
    // checagem manual que a UI nem chama.
    const status = this.mapStatus(this.str(data.status));
    const withdrawal = this.withdrawalsRepository.create({
      userId,
      pixKey: dto.pixKey,
      amount: dto.amountCents,
      gatewayWithdrawalId: this.str(data.id),
      status,
      requestedAt: new Date(),
      processedAt: status !== WithdrawalStatus.PENDING ? new Date() : null,
      rawResponse: data,
    });
    return this.withdrawalsRepository.save(withdrawal);
  }

  async findAllForUser(userId: string): Promise<Withdrawal[]> {
    return this.withdrawalsRepository.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async findOwned(userId: string, id: string): Promise<Withdrawal> {
    const withdrawal = await this.withdrawalsRepository.findOne({ where: { id, userId } });
    if (!withdrawal) throw new NotFoundException('Saque não encontrado.');
    return withdrawal;
  }

  /** Consulta GET /api/withdrawals/:id no gateway e atualiza o status local. */
  async checkStatus(userId: string, id: string): Promise<Withdrawal> {
    const withdrawal = await this.findOwned(userId, id);
    if (!withdrawal.gatewayWithdrawalId) {
      throw new HttpException(
        'Saque sem id de referência no gateway — não é possível consultar.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    this.logger.log(`-> GET /withdrawals/${withdrawal.gatewayWithdrawalId}`);

    let data: Record<string, unknown>;
    try {
      data = await this.gatewayAccountsService.withAuthenticatedClient(userId, async (client) => {
        const response = await client.get(`/withdrawals/${withdrawal.gatewayWithdrawalId}`);
        this.logger.log(
          `<- 200 /withdrawals/${withdrawal.gatewayWithdrawalId} resposta=${JSON.stringify(response.data)}`,
        );
        return response.data;
      });
    } catch (error) {
      throw toUpstreamHttpException(this.logger, error, 'Falha ao consultar o saque no gateway.');
    }

    withdrawal.status = this.mapStatus(this.str(data.status));
    withdrawal.rawResponse = data;
    if (withdrawal.status !== WithdrawalStatus.PENDING && !withdrawal.processedAt) {
      withdrawal.processedAt = new Date();
    }
    return this.withdrawalsRepository.save(withdrawal);
  }

  private mapStatus(status: string | null): WithdrawalStatus {
    const normalized = status?.toUpperCase();
    if (normalized && normalized in WithdrawalStatus) {
      return WithdrawalStatus[normalized as keyof typeof WithdrawalStatus];
    }
    return WithdrawalStatus.PENDING;
  }

  private str(value: unknown): string | null {
    return typeof value === 'string' && value.length > 0 ? value : null;
  }

  /** Aceita string ou number nas chaves candidatas. */
  private pick(payload: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = payload?.[key];
      if (typeof value === 'string' && value.length > 0) return value;
      if (typeof value === 'number' && !Number.isNaN(value)) return String(value);
    }
    return null;
  }

  // ---------------------------------------------------------------------
  // Webhooks (POST /api/webhooks/lera-box/withdrawal) — ver WebhooksService.
  // Separado em "localizar" (leitura, antes de validar a assinatura) e
  // "aplicar" (escrita, só depois de validada).
  // ---------------------------------------------------------------------

  /**
   * Localiza o saque de um payload de webhook, sem aplicar nada.
   * `transactionId` é o campo real usado pelo gateway nos callbacks
   * (confirmado no payload de PAYMENT_PIX/CARD — o Swagger não documenta);
   * `id` fica como fallback tolerante.
   */
  async findWithdrawalForWebhook(payload: Record<string, unknown>): Promise<Withdrawal | null> {
    const gatewayWithdrawalId = this.pick(payload, ['transactionId', 'id']);
    if (!gatewayWithdrawalId) return null;
    return this.withdrawalsRepository.findOne({ where: { gatewayWithdrawalId } });
  }

  /** Aplica o retorno assíncrono definitivo (webhook) a um saque já localizado. */
  async applyWithdrawalWebhook(
    withdrawal: Withdrawal,
    payload: Record<string, unknown>,
  ): Promise<Withdrawal> {
    withdrawal.status = this.mapStatus(this.str(payload.status));
    withdrawal.rawResponse = payload;
    if (withdrawal.status !== WithdrawalStatus.PENDING && !withdrawal.processedAt) {
      withdrawal.processedAt = new Date();
    }
    return this.withdrawalsRepository.save(withdrawal);
  }
}
