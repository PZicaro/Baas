/**
 * Rótulos em pt-BR pros status que a API devolve crus (pedidos, saques,
 * links de checkout, extrato da carteira) — usado onde só precisamos
 * traduzir o texto exibido, mantendo o código original pra classe CSS do
 * badge (`badge.PENDING`, `badge.APPROVED` etc. em styles.css).
 */
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  DENIED: 'Negado',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
  ACTIVE: 'Ativo',
  COMPLETED: 'Concluído',
};

export function statusLabel(status: string | null | undefined): string {
  if (!status) return '-';
  return STATUS_LABELS[status.toUpperCase()] ?? status;
}
