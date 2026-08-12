import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
