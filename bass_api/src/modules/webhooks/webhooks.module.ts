import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutLinksModule } from '../checkout-links/checkout-links.module';
import { GatewayAccountsModule } from '../gateway-accounts/gateway-accounts.module';
import { WithdrawalsModule } from '../withdrawals/withdrawals.module';
import { WebhookEvent } from './entities/webhook-event.entity';
import { WebhooksAdminController, WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookEvent]),
    GatewayAccountsModule,
    CheckoutLinksModule,
    WithdrawalsModule,
  ],
  controllers: [WebhooksAdminController, WebhooksController],
  providers: [WebhooksService],
  exports: [TypeOrmModule],
})
export class WebhooksModule {}
