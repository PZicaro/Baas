import { isAxiosError } from 'axios';

/**
 * Extrai uma mensagem de erro amigável de uma resposta da API.
 *
 * O HttpExceptionFilter do backend retorna `message` como string ou como
 * array de strings (quando o class-validator acumula múltiplos erros de
 * um DTO) — normalizamos os dois casos para uma única string exibível.
 */
export function extractErrorMessage(error: unknown, fallback = 'Algo deu errado. Tente novamente.'): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(' ');
    if (typeof message === 'string' && message.length > 0) return message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
