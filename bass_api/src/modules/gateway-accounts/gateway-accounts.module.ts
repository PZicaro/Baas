import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GatewayAccount } from './entities/gateway-account.entity';

/**
 * Registra a entidade GatewayAccount no TypeORM. Service/controller para
 * cadastro e login no gateway Lera Box entram aqui na próxima etapa da
 * integração (POST /api/users, POST /api/auth/login).
 */
@Module({
  imports: [TypeOrmModule.forFeature([GatewayAccount])],
  exports: [TypeOrmModule],
})
export class GatewayAccountsModule {}
