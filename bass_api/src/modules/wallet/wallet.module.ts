import { Module } from '@nestjs/common';
import { GatewayAccountsModule } from '../gateway-accounts/gateway-accounts.module';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

@Module({
  imports: [GatewayAccountsModule],
  controllers: [WalletController],
  providers: [WalletService],
})
export class WalletModule {}
