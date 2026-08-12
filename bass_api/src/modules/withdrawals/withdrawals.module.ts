import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Withdrawal } from './entities/withdrawal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Withdrawal])],
  exports: [TypeOrmModule],
})
export class WithdrawalsModule {}
