import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { RequestWithCorrelationId } from '../middleware/correlation-id.middleware';

/**
 * Complementa o LoggerMiddleware com uma visão por handler (controller.method),
 * útil para localizar rapidamente qual endpoint processou uma requisição.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Handler');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithCorrelationId>();
    const handlerName = `${context.getClass().name}.${context.getHandler().name}`;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.debug(
          `${handlerName} +${Date.now() - start}ms [correlationId=${request.correlationId}]`,
        );
      }),
    );
  }
}
