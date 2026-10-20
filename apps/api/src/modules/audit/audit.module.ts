import { Module } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service.js';
import { AuditService } from './audit.service.js';

@Module({
  providers: [AuditService, PrismaService],
  exports: [AuditService],
})
export class AuditModule {}
