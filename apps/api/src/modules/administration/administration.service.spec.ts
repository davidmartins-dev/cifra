import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../shared/database/prisma.service.js';
import { AdministrationService } from './administration.service.js';

describe('AdministrationService', () => {
  const adminId = 'admin-uuid-1';
  const targetUserId = 'user-uuid-2';

  describe('getPlatformMetrics', () => {
    it('deve retornar as métricas globais da plataforma', async () => {
      const prisma = {
        user: { count: vi.fn().mockResolvedValue(10) },
        account: { count: vi.fn().mockResolvedValue(15) },
        transaction: {
          aggregate: vi.fn().mockResolvedValue({
            _count: { id: 50 },
            _sum: { amount: 15420.5 },
          }),
        },
      } as unknown as PrismaService;

      const service = new AdministrationService(prisma);
      const result = await service.getPlatformMetrics();

      expect(prisma.user.count).toHaveBeenCalled();
      expect(prisma.account.count).toHaveBeenCalled();
      expect(prisma.transaction.aggregate).toHaveBeenCalled();
      expect(result).toEqual({
        totalUsers: 10,
        totalAccounts: 15,
        totalTransactions: 50,
        totalTransactionVolume: 15420.5,
      });
    });
  });

  describe('listUsers', () => {
    it('deve listar usuários com paginação e busca', async () => {
      const mockUsers = [
        {
          id: 'u-1',
          name: 'David',
          email: 'david@example.com',
          role: UserRole.ADMIN,
          _count: { accounts: 2, transactions: 10, categories: 5 },
        },
      ];

      const prisma = {
        user: {
          findMany: vi.fn().mockResolvedValue(mockUsers),
          count: vi.fn().mockResolvedValue(1),
        },
      } as unknown as PrismaService;

      const service = new AdministrationService(prisma);
      const result = await service.listUsers({ search: 'david', page: 1, limit: 10 });

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'david', mode: 'insensitive' } },
            { email: { contains: 'david', mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              accounts: true,
              transactions: true,
              categories: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      });

      expect(result).toEqual({
        data: mockUsers,
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
    });
  });

  describe('getUserDetails', () => {
    it('deve retornar detalhes do usuário com suas contagens', async () => {
      const mockUser = {
        id: targetUserId,
        name: 'Maria',
        email: 'maria@example.com',
        role: UserRole.USER,
        _count: { accounts: 1, transactions: 4, categories: 2 },
      };

      const prisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue(mockUser),
        },
      } as unknown as PrismaService;

      const service = new AdministrationService(prisma);
      const result = await service.getUserDetails(targetUserId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: targetUserId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              accounts: true,
              transactions: true,
              categories: true,
            },
          },
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('deve lançar NotFoundException se o usuário não for encontrado', async () => {
      const prisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      } as unknown as PrismaService;

      const service = new AdministrationService(prisma);

      await expect(service.getUserDetails('inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateUserRole', () => {
    it('deve atualizar o papel do usuário com sucesso', async () => {
      const targetUser = { id: targetUserId, role: UserRole.USER };
      const updatedUser = {
        id: targetUserId,
        name: 'Maria',
        email: 'maria@example.com',
        role: UserRole.ADMIN,
        updatedAt: new Date(),
      };

      const prisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue(targetUser),
          update: vi.fn().mockResolvedValue(updatedUser),
        },
      } as unknown as PrismaService;

      const service = new AdministrationService(prisma);
      const result = await service.updateUserRole(adminId, targetUserId, {
        role: UserRole.ADMIN,
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: targetUserId },
        data: { role: UserRole.ADMIN },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(updatedUser);
    });

    it('deve lançar BadRequestException se o administrador tentar revogar o próprio papel de ADMIN', async () => {
      const prisma = {
        user: {
          findUnique: vi.fn(),
        },
      } as unknown as PrismaService;

      const service = new AdministrationService(prisma);

      await expect(
        service.updateUserRole(adminId, adminId, { role: UserRole.USER }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar NotFoundException se o usuário alvo não for encontrado', async () => {
      const prisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      } as unknown as PrismaService;

      const service = new AdministrationService(prisma);

      await expect(
        service.updateUserRole(adminId, 'inexistente', { role: UserRole.ADMIN }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
