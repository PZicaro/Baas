import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard padrão para rotas protegidas. Usado junto ao decorator
 * @Public() (ver public.decorator.ts) para liberar exceções pontuais
 * quando o guard for aplicado globalmente.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
