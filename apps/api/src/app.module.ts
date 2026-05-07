import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { configValidationSchema } from './common/config/env.schema';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { CreatorsModule } from './modules/creators/creators.module';
import { HealthModule } from './modules/health/health.module';
import { InquiriesModule } from './modules/inquiries/inquiries.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { MessagesModule } from './modules/messages/messages.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PortfoliosModule } from './modules/portfolios/portfolios.module';
import { ProductsModule } from './modules/products/products.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { StudiosModule } from './modules/studios/studios.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => configValidationSchema.parse(config),
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),

    PrismaModule,

    HealthModule,
    AuthModule,
    UsersModule,
    CreatorsModule,
    StudiosModule,
    PortfoliosModule,
    InquiriesModule,
    JobsModule,
    BookingsModule,
    MessagesModule,
    CollectionsModule,
    QuotesModule,
    ContractsModule,
    PaymentsModule,
    ProductsModule,
    ReviewsModule,
    NotificationsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
