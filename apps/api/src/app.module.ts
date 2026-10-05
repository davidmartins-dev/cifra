import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { PrismaModule } from './shared/database/prisma.module.js';

@Module({
  imports: [PrismaModule, HealthModule, UsersModule, AuthModule],
})
export class AppModule {}


