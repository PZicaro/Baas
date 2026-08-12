import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca uma rota como pública. Sem uso enquanto o JwtAuthGuard é aplicado
 * por controller/rota; passa a ter efeito automaticamente se o guard for
 * promovido a APP_GUARD global no futuro.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
