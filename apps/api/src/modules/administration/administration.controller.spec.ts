import { UserRole } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { AdministrationController } from './administration.controller.js';
import type { AdministrationService } from './administration.service.js';

describe('AdministrationController', () => {
  const adminUserId = 'admin-1';
  const targetUserId = 'user-2';

  it('deve delegar a busca de métricas da plataforma para o AdministrationService', async () => {
    const mockMetrics = {
      totalUsers: 10,
      totalAccounts: 20,
      totalTransactions: 100,
      totalTransactionVolume: 50000,
    };

    const service = {
      getPlatformMetrics: vi.fn().mockResolvedValue(mockMetrics),
    } as unknown as AdministrationService;

    const controller = new AdministrationController(service);
    const result = await controller.getPlatformMetrics();

    expect(service.getPlatformMetrics).toHaveBeenCalled();
    expect(result).toEqual(mockMetrics);
  });

  it('deve delegar a listagem de usuários com filtros para o AdministrationService', async () => {
    const mockResponse = {
      data: [{ id: 'u-1', name: 'User 1' }],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };

    const service = {
      listUsers: vi.fn().mockResolvedValue(mockResponse),
    } as unknown as AdministrationService;

    const controller = new AdministrationController(service);
    const filter = { search: 'user', page: 1, limit: 10 };

    const result = await controller.listUsers(filter);

    expect(service.listUsers).toHaveBeenCalledWith(filter);
    expect(result).toEqual(mockResponse);
  });

  it('deve delegar a busca de detalhes do usuário para o AdministrationService', async () => {
    const mockUserDetails = {
      id: targetUserId,
      name: 'User 2',
      email: 'user2@example.com',
      role: UserRole.USER,
      _count: { accounts: 2, transactions: 10, categories: 3 },
    };

    const service = {
      getUserDetails: vi.fn().mockResolvedValue(mockUserDetails),
    } as unknown as AdministrationService;

    const controller = new AdministrationController(service);
    const result = await controller.getUserDetails(targetUserId);

    expect(service.getUserDetails).toHaveBeenCalledWith(targetUserId);
    expect(result).toEqual(mockUserDetails);
  });

  it('deve delegar a atualização do papel do usuário para o AdministrationService', async () => {
    const mockUpdatedUser = {
      id: targetUserId,
      name: 'User 2',
      email: 'user2@example.com',
      role: UserRole.ADMIN,
    };

    const service = {
      updateUserRole: vi.fn().mockResolvedValue(mockUpdatedUser),
    } as unknown as AdministrationService;

    const controller = new AdministrationController(service);
    const dto = { role: UserRole.ADMIN };

    const result = await controller.updateUserRole(
      adminUserId,
      targetUserId,
      dto,
    );

    expect(service.updateUserRole).toHaveBeenCalledWith(
      adminUserId,
      targetUserId,
      dto,
    );
    expect(result).toEqual(mockUpdatedUser);
  });
});
