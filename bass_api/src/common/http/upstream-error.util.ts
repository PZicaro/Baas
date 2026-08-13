import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import axios from 'axios';

/**
 * Converte um erro de uma chamada HTTP a um serviço externo (o gateway Lera
 * Box) numa HttpException do Nest, preservando a mensagem do upstream
 * quando disponível.
 *
 * Importante: nunca deixamos um 401 do upstream vazar como 401 da nossa
 * própria API. Um 401 na nossa API tem um significado específico — "sua
 * sessão aqui é inválida" — e o interceptor global do frontend usa isso
 * pra deslogar o usuário (ver `frontend_baas/src/services/api.ts`). Um 401
 * vindo do gateway externo (token da loja expirado, credenciais erradas no
 * cadastro/login do gateway, etc.) não tem nada a ver com a sessão do
 * usuário na BaaS; se vazasse como 401, o frontend chutaria o usuário —
 * ou até um pagador anônimo numa página pública de checkout — pro /login
 * à toa. `unauthorizedAs` define pra que status reescrever esse caso
 * (BAD_REQUEST quando o 401 reflete credenciais que o próprio usuário
 * acabou de digitar; BAD_GATEWAY quando reflete uma credencial já salva
 * que teria que "simplesmente funcionar").
 */
export function toUpstreamHttpException(
  logger: Logger,
  error: unknown,
  fallback: string,
  unauthorizedAs: HttpStatus = HttpStatus.BAD_GATEWAY,
): HttpException {
  // Erros que já são um HttpException nosso (ex.: o ForbiddenException de
  // "conecte a loja ao gateway antes de continuar") não vieram de uma
  // chamada axios ao upstream — são deste próprio processo e já carregam
  // o status/mensagem corretos. Repassa sem reembrulhar.
  if (error instanceof HttpException) {
    return error;
  }
  if (axios.isAxiosError(error)) {
    const upstreamStatus = error.response?.status ?? HttpStatus.BAD_GATEWAY;
    const status = upstreamStatus === HttpStatus.UNAUTHORIZED ? unauthorizedAs : upstreamStatus;
    const body = error.response?.data;
    logger.error(
      `<- ${upstreamStatus} código=${error.code ?? '-'} resposta=${JSON.stringify(body)}`,
    );
    const message = (body as { message?: string })?.message ?? fallback;
    return new HttpException(message, status);
  }
  logger.error(fallback, error instanceof Error ? error.stack : String(error));
  return new HttpException(fallback, HttpStatus.BAD_GATEWAY);
}
