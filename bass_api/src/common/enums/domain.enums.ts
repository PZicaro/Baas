/**
 * Enums de domínio compartilhados entre os módulos que integram com o
 * gateway Lera Box (checkout, orders, transactions, withdrawals, webhooks).
 * Mantidos centralizados para evitar strings soltas e alinhar o vocabulário
 * usado no BaaS com o vocabulário do gateway (ver contrato resumido).
 */

export enum PaymentMethod {
  PIX = 'pix',
  CARD = 'card',
}

/** Estado do pedido/pagamento, alinhado ao mapeamento sugerido no desafio. */
export enum OrderStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

/** Estado do link/sessão de checkout em si (independente do pedido). */
export enum CheckoutLinkStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

/** Tipo de movimentação espelhada do extrato do gateway (wallet/transactions). */
export enum TransactionType {
  PIX = 'PIX',
  CARD = 'CARD',
  WITHDRAWAL = 'WITHDRAWAL',
  FEE = 'FEE',
  OTHER = 'OTHER',
}

export enum WithdrawalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
  CANCELLED = 'CANCELLED',
}

/** Tipos de evento de webhook cadastrados no gateway. */
export enum WebhookEventType {
  PAYMENT_PIX = 'PAYMENT_PIX',
  PAYMENT_CARD = 'PAYMENT_CARD',
  WITHDRAWAL = 'WITHDRAWAL',
}

/**
 * Segmento de URL usado tanto pra cadastrar o webhook no gateway
 * (GatewayAccountsService) quanto pra rotear o POST recebido de volta pro
 * evento certo (WebhooksController) — uma única fonte de verdade pros dois
 * lados, pra nunca ficarem dessincronizados.
 */
export const WEBHOOK_EVENT_SLUGS: Record<WebhookEventType, string> = {
  [WebhookEventType.PAYMENT_PIX]: 'payment-pix',
  [WebhookEventType.PAYMENT_CARD]: 'payment-card',
  [WebhookEventType.WITHDRAWAL]: 'withdrawal',
};
