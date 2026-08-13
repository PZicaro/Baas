import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GatewayAccountsModule } from '../gateway-accounts/gateway-accounts.module';
import { Withdrawal } from './entities/withdrawal.entity';
import { WithdrawalsController } from './withdrawals.controller';
import { WithdrawalsService } from './withdrawals.service';

@Module({
  imports: [TypeOrmModule.forFeature([Withdrawal]), GatewayAccountsModule],
  controllers: [WithdrawalsController],
  providers: [WithdrawalsService],
  exports: [TypeOrmModule, WithdrawalsService],
})
export class WithdrawalsModule {}
