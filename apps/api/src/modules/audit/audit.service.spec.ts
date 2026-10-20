import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../shared/database/prisma.service.js';
import { AuditService } from './audit.service.js';

describe('AuditService', () => {
  const mockAuditLog = {
    id: 'log-uuid-1',
    userId: 'user-uuid-1',
    action: 'AUTH_LOGIN',
    resource: 'User',
    resourceId: 'user-uuid-1',
    details: { method: 'password' },
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    createdAt: new Date('2026-10-20T10:00:00.000Z'),
    user: {
      id: 'user-uuid-1',
      name: 'David',
      email: 'david@cifra.app',
      role: 'ADMIN',
    },
  };

  describe('log', () => {
    it('deve registrar um evento de auditoria com sucesso', async () => {
      const prisma = {
        auditLog: {
          create: vi.fn().mockResolvedValue(mockAuditLog),
        },
      } as unknown as PrismaService;

      const service = new AuditService(prisma);
      const result = await service.log({
        userId: 'user-uuid-1',
        action: 'AUTH_LOGIN',
        resource: 'User',
        resourceId: 'user-uuid-1',
        details: { method: 'password' },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-uuid-1',
          action: 'AUTH_LOGIN',
          resource: 'User',
          resourceId: 'user-uuid-1',
          details: { method: 'password' },
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
        },
      });
      expect(result).toEqual(mockAuditLog);
    });

    it('deve registrar um evento sem usuário e sem detalhes adicionais (valores nulos)', async () => {
      const prisma = {
        auditLog: {
          create: vi.fn().mockResolvedValue({
            ...mockAuditLog,
            userId: null,
            details: null,
          }),
        },
      } as unknown as PrismaService;

      const service = new AuditService(prisma);
      await service.log({
        action: 'SYSTEM_STARTUP',
        resource: 'System',
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: null,
          action: 'SYSTEM_STARTUP',
          resource: 'System',
          resourceId: null,
          details: Prisma.JsonNull,
          ipAddress: null,
          userAgent: null,
        },
      });
    });
  });

  describe('findAll', () => {
    it('deve listar logs paginados com filtros padrão', async () => {
      const prisma = {
        auditLog: {
          count: vi.fn().mockResolvedValue(1),
          findMany: vi.fn().mockResolvedValue([mockAuditLog]),
        },
      } as unknown as PrismaService;

      const service = new AuditService(prisma);
      const result = await service.findAll();

      expect(prisma.auditLog.count).toHaveBeenCalledWith({ where: {} });
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {},
        take: 20,
        skip: 0,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });
      expect(result).toEqual({
        data: [mockAuditLog],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('deve aplicar filtros por userId, action, resource e período de data', async () => {
      const prisma = {
        auditLog: {
          count: vi.fn().mockResolvedValue(1),
          findMany: vi.fn().mockResolvedValue([mockAuditLog]),
        },
      } as unknown as PrismaService;

      const service = new AuditService(prisma);
      const result = await service.findAll({
        userId: 'user-uuid-1',
        action: 'LOGIN',
        resource: 'User',
        startDate: '2026-10-01T00:00:00.000Z',
        endDate: '2026-10-31T23:59:59.999Z',
        page: 2,
        limit: 10,
      });

      expect(prisma.auditLog.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-uuid-1',
          action: { contains: 'LOGIN', mode: 'insensitive' },
          resource: { contains: 'User', mode: 'insensitive' },
          createdAt: {
            gte: new Date('2026-10-01T00:00:00.000Z'),
            lte: new Date('2026-10-31T23:59:59.999Z'),
          },
        },
      });
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 10,
        }),
      );
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });
  });

  describe('findById', () => {
    it('deve retornar o log de auditoria quando existir', async () => {
      const prisma = {
        auditLog: {
          findUnique: vi.fn().mockResolvedValue(mockAuditLog),
        },
      } as unknown as PrismaService;

      const service = new AuditService(prisma);
      const result = await service.findById('log-uuid-1');

      expect(prisma.auditLog.findUnique).toHaveBeenCalledWith({
        where: { id: 'log-uuid-1' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });
      expect(result).toEqual(mockAuditLog);
    });

    it('deve lançar NotFoundException quando o log não for encontrado', async () => {
      const prisma = {
        auditLog: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      } as unknown as PrismaService;

      const service = new AuditService(prisma);
      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
