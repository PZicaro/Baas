import { HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { randomBytes, randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { CheckoutLinkStatus, OrderStatus, PaymentMethod } from '../../common/enums/domain.enums';
import { FeesService } from '../fees/fees.service';
import { GatewayAccountsService } from '../gateway-accounts/gateway-accounts.service';
import { Order } from '../orders/entities/order.entity';
import { CreateCheckoutLinkDto } from './dto/create-checkout-link.dto';
import { PayCardDto } from './dto/pay-card.dto';
import { CheckoutLink } from './entities/checkout-link.entity';

/** Prazo de validade padrão de um link recém-criado. */
const LINK_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class CheckoutLinksService {
  private readonly logger = new Logger(CheckoutLinksService.name);

  constructor(
    @InjectRepository(CheckoutLink)
    private readonly checkoutLinksRepository: Repository<CheckoutLink>,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly gatewayAccountsService: GatewayAccountsService,
    private readonly feesService: FeesService,
  ) {}

  // ---------------------------------------------------------------------
  // Lojista (autenticado): criar, listar, acompanhar.
  // ---------------------------------------------------------------------

  async create(userId: string, dto: CreateCheckoutLinkDto): Promise<CheckoutLink> {
    const link = this.checkoutLinksRepository.create({
      userId,
      slug: randomBytes(6).toString('hex'),
      method: dto.method,
      amount: dto.amountCents,
      description: dto.description ?? null,
      payerName: dto.payerName ?? null,
      payerEmail: dto.payerEmail ?? null,
      payerPhone: dto.payerPhone ?? null,
      payerDocument: dto.payerDocument ?? null,
      externalReference: `LNK-${randomUUID()}`,
      expiresAt: new Date(Date.now() + LINK_TTL_MS),
    });
    return this.checkoutLinksRepository.save(link);
  }

  async findAllForUser(userId: string): Promise<CheckoutLink[]> {
    const links = await this.checkoutLinksRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return Promise.all(links.map((link) => this.applyExpiration(link)));
  }

  async findOwned(userId: string, id: string): Promise<CheckoutLink> {
    const link = await this.checkoutLinksRepository.findOne({ where: { id, userId } });
    if (!link) throw new NotFoundException('Link de checkout não encontrado.');
    return this.applyExpiration(link);
  }

  // ---------------------------------------------------------------------
  // Pagador (público, por slug): abrir o link e efetuar o pagamento.
  // Sem sessão do BaaS — a identidade de quem cobra vem do link.userId.
  // ---------------------------------------------------------------------

  async findBySlug(slug: string): Promise<CheckoutLink> {
    const link = await this.checkoutLinksRepository.findOne({ where: { slug } });
    if (!link) throw new NotFoundException('Link de pagamento não encontrado.');
    return this.applyExpiration(link);
  }

  async generatePixBySlug(slug: string): Promise<Order> {
    return this.generatePix(await this.findBySlug(slug));
  }

  async payCardBySlug(slug: string, dto: PayCardDto): Promise<Order> {
    return this.payCard(await this.findBySlug(slug), dto);
  }

  async checkStatusBySlug(slug: string): Promise<Order> {
    return this.checkStatus(await this.findBySlug(slug));
  }

  /** Mesma checagem, mas pro lojista acompanhar do dashboard (não dispara pagamento). */
  async checkStatusOwned(userId: string, linkId: string): Promise<Order> {
    return this.checkStatus(await this.findOwned(userId, linkId));
  }

  /**
   * Checagem sob demanda: sem job de fundo, um link vencido só passa a
   * valer como EXPIRED quando alguém o lista ou tenta usá-lo.
   */
  private async applyExpiration(link: CheckoutLink): Promise<CheckoutLink> {
    const isExpired =
      link.status === CheckoutLinkStatus.ACTIVE &&
      link.expiresAt !== null &&
      link.expiresAt.getTime() < Date.now();
    if (!isExpired) return link;

    link.status = CheckoutLinkStatus.EXPIRED;
    return this.checkoutLinksRepository.save(link);
  }

  private assertActive(link: CheckoutLink): void {
    if (link.status !== CheckoutLinkStatus.ACTIVE) {
      throw new HttpException(
        `Este link não está mais disponível (status: ${link.status}).`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  /** Gera a cobrança Pix (POST /api/payments/pix) pro link informado. */
  private async generatePix(link: CheckoutLink): Promise<Order> {
    this.assertActive(link);
    if (link.method !== PaymentMethod.PIX) {
      throw new HttpException('Este link não é do método Pix.', HttpStatus.UNPROCESSABLE_ENTITY);
    }
    if (!link.payerDocument) {
      throw new HttpException(
        'Link sem payerDocument — obrigatório para gerar cobrança Pix.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const client = await this.gatewayAccountsService.getAuthenticatedClient(link.userId);
    const payload = {
      amount: link.amount,
      description: link.description ?? undefined,
      payerDocument: link.payerDocument,
      externalReference: link.externalReference,
    };
    this.logger.log(`-> POST /payments/pix payload=${JSON.stringify(payload)}`);

    let data: Record<string, unknown>;
    try {
      const response = await client.post('/payments/pix', payload);
      data = response.data;
      this.logger.log(`<- 201 /payments/pix resposta=${JSON.stringify(data)}`);
    } catch (error) {
      throw this.toHttpException(error, 'Falha ao gerar a cobrança Pix no gateway.');
    }

    // Uma tentativa por link neste modelo simples: uma vez que a cobrança
    // foi gerada no gateway, o link deixa de aceitar novas tentativas.
    link.status = CheckoutLinkStatus.COMPLETED;
    await this.checkoutLinksRepository.save(link);

    const order = this.ordersRepository.create({
      checkoutLinkId: link.id,
      userId: link.userId,
      method: PaymentMethod.PIX,
      amount: link.amount,
      // O status da resposta síncrona é só preliminar — o resultado
      // definitivo (aprovado/negado) vem depois, via checagem manual
      // (GET /payments/:id) ou webhook. Nunca gravamos como final aqui.
      status: OrderStatus.PENDING,
      externalReference: link.externalReference,
      gatewayPaymentId: this.str(data.id ?? data.paymentId),
      gatewayTxid: this.str(data.txid ?? data.txId),
      qrCodeBase64: this.str(data.qrCodeBase64),
      emv: this.str(data.emv),
      rawResponse: data,
    });
    return this.ordersRepository.save(order);
  }

  /** Processa a cobrança de cartão (POST /api/payments/card) pro link informado. */
  private async payCard(link: CheckoutLink, dto: PayCardDto): Promise<Order> {
    this.assertActive(link);
    if (link.method !== PaymentMethod.CARD) {
      throw new HttpException('Este link não é do método cartão.', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    // Nunca aceitamos feePercent vindo do cliente: consultamos a tabela
    // oficial e usamos o valor de lá, evitando divergência com o gateway.
    const feePercent = await this.feesService.findFeePercent(dto.brand, dto.installments);

    const client = await this.gatewayAccountsService.getAuthenticatedClient(link.userId);
    const payload = {
      amount: link.amount,
      description: link.description ?? undefined,
      externalReference: link.externalReference,
      cardNumber: dto.cardNumber,
      cardHolder: dto.cardHolder,
      expiryMonth: dto.expiryMonth,
      expiryYear: dto.expiryYear,
      cvv: dto.cvv,
      installments: dto.installments,
      feePercent,
    };
    this.logger.log(
      `-> POST /payments/card payload=${JSON.stringify({ ...payload, cardNumber: '****', cvv: '***' })}`,
    );

    let data: Record<string, unknown>;
    try {
      const response = await client.post('/payments/card', payload);
      data = response.data;
      this.logger.log(`<- 201 /payments/card resposta=${JSON.stringify(data)}`);
    } catch (error) {
      throw this.toHttpException(error, 'Falha ao processar o pagamento no gateway.');
    }

    link.installments = dto.installments;
    link.feePercent = String(feePercent);
    link.status = CheckoutLinkStatus.COMPLETED;
    await this.checkoutLinksRepository.save(link);

    const order = this.ordersRepository.create({
      checkoutLinkId: link.id,
      userId: link.userId,
      method: PaymentMethod.CARD,
      amount: link.amount,
      installments: dto.installments,
      feePercent: String(feePercent),
      // Mesma lógica do Pix: status inicial sempre PENDING, resultado
      // definitivo só sai numa checagem posterior (GET /payments/:id).
      status: OrderStatus.PENDING,
      externalReference: link.externalReference,
      gatewayPaymentId: this.str(data.id ?? data.paymentId),
      rawResponse: data,
    });
    return this.ordersRepository.save(order);
  }

  /**
   * Checagem manual de status: consulta GET /api/payments/:id no gateway
   * e atualiza o pedido local. Sem webhook cadastrado (exige URL pública),
   * essa é a forma de saber se um Pix/cartão pendente já foi definido.
   */
  private async checkStatus(link: CheckoutLink): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { checkoutLinkId: link.id },
      order: { createdAt: 'DESC' },
    });
    if (!order) throw new NotFoundException('Nenhum pedido gerado para este link ainda.');
    if (!order.gatewayPaymentId) {
      throw new HttpException(
        'Pedido sem id de pagamento no gateway — não é possível consultar.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const client = await this.gatewayAccountsService.getAuthenticatedClient(link.userId);
    this.logger.log(`-> GET /payments/${order.gatewayPaymentId}`);

    let data: Record<string, unknown>;
    try {
      const response = await client.get(`/payments/${order.gatewayPaymentId}`);
      data = response.data;
      this.logger.log(
        `<- 200 /payments/${order.gatewayPaymentId} resposta=${JSON.stringify(data)}`,
      );
    } catch (error) {
      throw this.toHttpException(error, 'Falha ao consultar o pagamento no gateway.');
    }

    order.status = this.mapGatewayStatus(this.str(data.status));
    order.rawResponse = data;
    if (order.status === OrderStatus.APPROVED && !order.paidAt) {
      order.paidAt = new Date();
    }
    return this.ordersRepository.save(order);
  }

  private mapGatewayStatus(status: string | null): OrderStatus {
    const normalized = status?.toUpperCase();
    if (normalized && normalized in OrderStatus)
      return OrderStatus[normalized as keyof typeof OrderStatus];
    return OrderStatus.PENDING;
  }

  private str(value: unknown): string | null {
    return typeof value === 'string' && value.length > 0 ? value : null;
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
