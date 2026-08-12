import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeesModule } from '../fees/fees.module';
import { GatewayAccountsModule } from '../gateway-accounts/gateway-accounts.module';
import { Order } from '../orders/entities/order.entity';
import { CheckoutLinksController } from './checkout-links.controller';
import { CheckoutLinksService } from './checkout-links.service';
import { CheckoutPublicController } from './checkout-public.controller';
import { CheckoutLink } from './entities/checkout-link.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CheckoutLink, Order]), GatewayAccountsModule, FeesModule],
  controllers: [CheckoutLinksController, CheckoutPublicController],
  providers: [CheckoutLinksService],
  exports: [TypeOrmModule],
})
export class CheckoutLinksModule {}
