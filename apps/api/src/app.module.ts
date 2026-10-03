import { Module } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module.js';
import { PrismaModule } from './shared/database/prisma.module.js';

@Module({
  imports: [PrismaModule, HealthModule],
})
export class AppModule {}
