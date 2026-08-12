import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutLink } from './entities/checkout-link.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CheckoutLink])],
  exports: [TypeOrmModule],
})
export class CheckoutLinksModule {}
