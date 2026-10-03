import { Injectable } from '@nestjs/common';
import { createRequire } from 'node:module';
import { PrismaService } from '../../shared/database/prisma.service.js'

const require = createRequire(import.meta.url);
const packageJson = require('../../../package.json');

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check() {
    let database = 'up';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'down';
    }

    const { version } = packageJson;

    return {
      status: database === 'up' ? 'ok' : 'error',
      database,
      uptime: process.uptime(),
      version,
    };
  }
}
