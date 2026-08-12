import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GatewayAccount } from './entities/gateway-account.entity';
import { GatewayAccountsController } from './gateway-accounts.controller';
import { GatewayAccountsService } from './gateway-accounts.service';

/**
 * Cadastro e login no gateway Lera Box (POST /api/users, POST /api/auth/login)
 * a partir do BaaS, com o vínculo persistido em GatewayAccount.
 */
@Module({
  imports: [TypeOrmModule.forFeature([GatewayAccount])],
  controllers: [GatewayAccountsController],
  providers: [GatewayAccountsService],
  exports: [TypeOrmModule, GatewayAccountsService],
})
export class GatewayAccountsModule {}
