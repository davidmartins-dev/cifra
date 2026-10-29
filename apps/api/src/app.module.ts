import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AccountsModule } from './modules/accounts/accounts.module.js';
import { AdministrationModule } from './modules/administration/administration.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { EmailVerificationModule } from './modules/email-verification/email-verification.module.js';
import { FinancialSummaryModule } from './modules/financial-summary/financial-summary.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { ObservabilityModule } from './modules/observability/observability.module.js';
import { TransactionsModule } from './modules/transactions/transactions.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { PrismaModule } from './shared/database/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 20,
      },
    ]),
    ObservabilityModule,
    PrismaModule,
    HealthModule,
    UsersModule,
    AuthModule,
    EmailVerificationModule,
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    FinancialSummaryModule,
    AdministrationModule,
    AuditModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
