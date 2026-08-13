import {
  BadGatewayException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios, { AxiosInstance } from 'axios';
import { Repository } from 'typeorm';
import { decryptSecret, encryptSecret } from '../../common/crypto/encryption.util';
import { toUpstreamHttpException } from '../../common/http/upstream-error.util';
import { GatewayStatusDto } from './dto/gateway-status.dto';
import { LoginGatewayDto } from './dto/login-gateway.dto';
import { RegisterGatewayDto } from './dto/register-gateway.dto';
import { GatewayAccount } from './entities/gateway-account.entity';

@Injectable()
export class GatewayAccountsService {
  private readonly logger = new Logger(GatewayAccountsService.name);
  private readonly http: AxiosInstance;

  constructor(
    @InjectRepository(GatewayAccount)
    private readonly gatewayAccountsRepository: Repository<GatewayAccount>,
    private readonly configService: ConfigService,
  ) {
    this.http = axios.create({
      baseURL: this.configService.get<string>('gateway.baseUrl'),
      timeout: 15_000,
    });
  }

  /** Cadastro público no gateway (POST /api/users) — não persiste nada localmente ainda. */
  async registerAtGateway(dto: RegisterGatewayDto): Promise<{ message: string }> {
    const payload = {
      personType: dto.personType,
      name: dto.name,
      // tradingName/complement são opcionais no gateway, mas a validação
      // deles rejeita string vazia (não trata "" como "não enviado") — só
      // incluímos no corpo quando há conteúdo de verdade.
      ...(dto.tradingName?.trim() ? { tradingName: dto.tradingName.trim() } : {}),
      email: dto.email,
      phone: dto.phone,
      document: dto.document,
      zipCode: dto.zipCode,
      address: dto.address,
      number: dto.number,
      ...(dto.complement?.trim() ? { complement: dto.complement.trim() } : {}),
      neighborhood: dto.neighborhood,
      city: dto.city,
      state: dto.state,
    };
    const url = `${this.http.defaults.baseURL}/users`;
    this.logger.log(`-> POST ${url} payload=${JSON.stringify(payload)}`);

    try {
      const { data } = await this.http.post('/users', payload);
      this.logger.log(`<- 201 /users resposta=${JSON.stringify(data)}`);
      return {
        message:
          data?.message ??
          'Cadastro enviado ao gateway. Verifique seu e-mail para receber documento, senha, CodigoCliente e ChaveLoja.',
      };
    } catch (error) {
      throw toUpstreamHttpException(
        this.logger,
        error,
        'Falha ao cadastrar no gateway.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Login no gateway (POST /api/auth/login) + vínculo/atualização da conta
   * do lojista (upsert 1:1 por userId). A senha é guardada cifrada para
   * permitir relogar automaticamente quando o token expirar.
   */
  async connect(userId: string, dto: LoginGatewayDto): Promise<GatewayStatusDto> {
    const url = `${this.http.defaults.baseURL}/auth/login`;
    this.logger.log(`-> POST ${url} document=${dto.document}`);

    let response: Record<string, unknown>;
    try {
      const { data } = await this.http.post('/auth/login', {
        document: dto.document,
        password: dto.password,
      });
      response = data;
      this.logger.log(`<- 200 /auth/login resposta=${JSON.stringify(data)}`);
    } catch (error) {
      throw toUpstreamHttpException(
        this.logger,
        error,
        'Falha ao autenticar no gateway.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Formato real confirmado em produção (o Swagger do gateway não
    // documenta esse schema de resposta):
    // { access_token, token_type: "Bearer", codigoCliente: <number>,
    //   chaveLoja: <string>, user: {...} }
    // codigoCliente vem como número, não string — pick() abaixo aceita os dois.
    const accessToken = this.pick(response, [
      'access_token',
      'Token',
      'token',
      'accessToken',
      'AccessToken',
    ]);
    const codigoCliente = this.pick(response, ['codigoCliente', 'CodigoCliente']);
    const chaveLoja = this.pick(response, ['chaveLoja', 'ChaveLoja']);

    if (!accessToken || !codigoCliente || !chaveLoja) {
      this.logger.error(
        `Resposta inesperada do gateway em /auth/login: ${JSON.stringify(response)}`,
      );
      throw new BadGatewayException('Resposta inesperada do gateway ao autenticar.');
    }

    const encryptionKey = this.configService.get<string>('gateway.encryptionKey')!;
    const account =
      (await this.gatewayAccountsRepository.findOne({ where: { userId } })) ??
      this.gatewayAccountsRepository.create({ userId });

    account.documento = dto.document;
    if (dto.email) account.gatewayEmail = dto.email;
    if (dto.phone) account.gatewayPhone = dto.phone;
    account.codigoCliente = codigoCliente;
    account.chaveLoja = chaveLoja;
    account.passwordEncrypted = encryptSecret(dto.password, encryptionKey);
    account.accessToken = accessToken;
    account.tokenExpiresAt = null;
    account.active = true;

    await this.gatewayAccountsRepository.save(account);

    return {
      connected: true,
      codigoCliente: account.codigoCliente,
      gatewayEmail: account.gatewayEmail,
      active: account.active,
    };
  }

  async getAuthenticatedClient(userId: string): Promise<AxiosInstance> {
    const account = await this.gatewayAccountsRepository.findOne({ where: { userId } });
    if (!account?.accessToken || !account.active) {
      throw new ForbiddenException('Conecte a loja ao gateway (Lera Box) antes de continuar.');
    }
    return axios.create({
      baseURL: this.configService.get<string>('gateway.baseUrl'),
      timeout: 15_000,
      headers: { Authorization: `Bearer ${account.accessToken}` },
    });
  }

  /**
   * Executa `fn` com um client autenticado no gateway; se a chamada falhar
   * com 401 (token da loja expirado), reloga automaticamente com a senha
   * salva ([[GatewayAccount.passwordEncrypted]]) e tenta de novo, uma única
   * vez, antes de deixar o erro subir. Sem isso, todo mundo que depende do
   * gateway (saldo, extrato, saques, cobranças) quebrava assim que o token
   * expirasse, mesmo com a sessão do usuário na BaaS perfeitamente válida.
   */
  async withAuthenticatedClient<T>(
    userId: string,
    fn: (client: AxiosInstance) => Promise<T>,
  ): Promise<T> {
    const client = await this.getAuthenticatedClient(userId);
    try {
      return await fn(client);
    } catch (error) {
      if (!axios.isAxiosError(error) || error.response?.status !== HttpStatus.UNAUTHORIZED) {
        throw error;
      }
      this.logger.warn(`Token do gateway expirado para userId=${userId}; relogando...`);
      const refreshedClient = await this.reconnect(userId);
      return fn(refreshedClient);
    }
  }

  /** Refaz o login no gateway com a senha salva e devolve um client novo já autenticado. */
  private async reconnect(userId: string): Promise<AxiosInstance> {
    const account = await this.gatewayAccountsRepository.findOne({ where: { userId } });
    if (!account?.passwordEncrypted) {
      throw new ForbiddenException('Conecte a loja ao gateway (Lera Box) antes de continuar.');
    }
    await this.connect(userId, {
      document: account.documento,
      password: this.decryptStoredPassword(account),
      email: account.gatewayEmail ?? undefined,
      phone: account.gatewayPhone ?? undefined,
    });
    return this.getAuthenticatedClient(userId);
  }

  async getDocument(userId: string): Promise<string | null> {
    const account = await this.gatewayAccountsRepository.findOne({ where: { userId } });
    return account?.documento ?? null;
  }

  async getStatus(userId: string): Promise<GatewayStatusDto> {
    const account = await this.gatewayAccountsRepository.findOne({ where: { userId } });
    if (!account) return { connected: false };

    return {
      connected: Boolean(account.accessToken) && account.active,
      codigoCliente: account.codigoCliente,
      gatewayEmail: account.gatewayEmail,
      active: account.active,
    };
  }

  /** Descriptografa a senha salva — usado por [[reconnect]] para relogar no gateway quando o token expira. */
  decryptStoredPassword(account: GatewayAccount): string {
    const encryptionKey = this.configService.get<string>('gateway.encryptionKey')!;
    return decryptSecret(account.passwordEncrypted, encryptionKey);
  }

  /** Aceita string ou number (ex.: codigoCliente vem como número na resposta real). */
  private pick(obj: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = obj?.[key];
      if (typeof value === 'string' && value.length > 0) return value;
      if (typeof value === 'number' && !Number.isNaN(value)) return String(value);
    }
    return null;
  }
}
