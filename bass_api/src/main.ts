import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    // Necessário pra validar X-Lera-Box-Signature: o HMAC é calculado sobre
    // o corpo bruto recebido, não sobre o JSON re-serializado (que pode
    // diferir em espaçamento/ordem de chaves). Com isso o Nest expõe
    // `request.rawBody` além do body já parseado.
    rawBody: true,
  });

  const configService = app.get(ConfigService);
  const apiPrefix = configService.get<string>('apiPrefix', 'api');
  const port = configService.get<number>('port', 3000);
  const corsOrigin = configService.get<string>('corsOrigin', '*');

  app.use(
    helmet({
      // Frontend e API vivem em origens diferentes de propósito (portas
      // distintas). O CORP padrão do helmet ("same-origin") faz o navegador
      // descartar a resposta antes de entregá-la ao JS — a requisição chega
      // e é processada normalmente (aparece nos logs), mas o fetch/axios no
      // browser estoura como "Network Error". Quem já controla as origens
      // permitidas é o CORS abaixo; aqui só liberamos o CORP para não duplicar
      // (e conflitar com) essa política.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser());
  app.enableCors({
    // credentials:true exige uma origem explícita (nunca '*') para o
    // navegador aceitar enviar/receber o cookie httpOnly de sessão.
    origin: corsOrigin === '*' ? true : corsOrigin.split(','),
    credentials: true,
  });

  app.setGlobalPrefix(apiPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  setupSwagger(app, apiPrefix);

  await app.listen(port);

  Logger.log(`🚀 Aplicação rodando em http://localhost:${port}/${apiPrefix}`, 'Bootstrap');
  Logger.log(`📚 Documentação Swagger em http://localhost:${port}/${apiPrefix}/docs`, 'Bootstrap');
}

bootstrap();
