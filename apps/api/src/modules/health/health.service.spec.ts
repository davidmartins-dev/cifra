import { describe, expect, it, vi } from 'vitest';
import { HealthService } from './health.service.js';
import { PrismaService } from '../../shared/database/prisma.service.js';

describe('HealthService', () => {
  it('deve retornar status ok quando o banco estiver disponível', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([{ result: 1 }]),
    } as unknown as PrismaService;

    const service = new HealthService(prisma);

    const result = await service.check();

    expect(result.status).toBe('ok');
    expect(result.database).toBe('up');
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('deve retornar status error quando o banco estiver indisponível', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockRejectedValue(new Error('Database unavailable')),
    } as unknown as PrismaService;

    const service = new HealthService(prisma);

    const result = await service.check();

    expect(result.status).toBe('error');
    expect(result.database).toBe('down');
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });
});
