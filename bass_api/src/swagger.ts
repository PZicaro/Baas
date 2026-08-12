import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AUTH_COOKIE_NAME } from './modules/auth/auth.constants';

/**
 * Documentação da API exposta em /{apiPrefix}/docs (ex.: /api/docs) e o
 * JSON bruto em /{apiPrefix}/docs-json, usado pelo candidato para explorar
 * e testar os endpoints disponíveis.
 */
export function setupSwagger(app: INestApplication, apiPrefix: string): void {
  const config = new DocumentBuilder()
    .setTitle('BaaS API')
    .setDescription('Documentação da API da plataforma BaaS (Backend as a Service)')
    .setVersion('1.0')
    // Sessão via cookie httpOnly (setado por POST /auth/login|register) —
    // não há Bearer token exposto ao cliente.
    .addCookieAuth(AUTH_COOKIE_NAME, { type: 'apiKey', in: 'cookie', name: AUTH_COOKIE_NAME })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
