import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { RequestWithCorrelationId } from './correlation-id.middleware';

/**
 * Loga requisição/resposta com método, rota, status, tempo de resposta e
 * correlation id. Roda depois do CorrelationIdMiddleware na cadeia.
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: RequestWithCorrelationId, res: Response, next: NextFunction): void {
    const { method, originalUrl, correlationId } = req;
    const start = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - start;
      this.logger.log(
        `${method} ${originalUrl} ${statusCode} +${duration}ms [correlationId=${correlationId}]`,
      );
    });

    next();
  }
}
