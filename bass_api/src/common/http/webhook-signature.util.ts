import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Recalcula o HMAC-SHA256 do corpo bruto do webhook e compara em tempo
 * constante com o header `X-Lera-Box-Signature` (hex). Espera o corpo
 * *bruto* (Buffer/string), nunca o JSON re-serializado — reformatar
 * (espaçamento, ordem de chaves) muda os bytes e quebraria a comparação
 * mesmo com uma assinatura genuína.
 */
export function verifyWebhookSignature(
  rawBody: Buffer | string,
  secret: string,
  signatureHeader: string | undefined | null,
): boolean {
  if (!signatureHeader) return false;

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  const receivedBuffer = Buffer.from(signatureHeader.trim(), 'hex');

  // timingSafeEqual exige buffers do mesmo tamanho — um header malformado/
  // truncado não deve derrubar a requisição com uma exceção, só falhar a
  // validação normalmente.
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}
