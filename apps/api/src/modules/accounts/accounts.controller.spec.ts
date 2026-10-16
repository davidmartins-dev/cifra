import { AccountType } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { AccountsController } from './accounts.controller.js';
import type { AccountsService } from './accounts.service.js';

describe('AccountsController', () => {
  const userId = 'user-1';

  it('deve delegar a criação de conta para o AccountsService', async () => {
    const mockAccount = {
      id: 'acc-1',
      name: 'Nubank',
      type: AccountType.CHECKING,
      balance: 100,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const service = {
      create: vi.fn().mockResolvedValue(mockAccount),
    } as unknown as AccountsService;

    const controller = new AccountsController(service);
    const dto = { name: 'Nubank', type: AccountType.CHECKING, balance: 100 };

    const result = await controller.create(userId, dto);

    expect(service.create).toHaveBeenCalledWith(userId, dto);
    expect(result).toEqual(mockAccount);
  });

  it('deve delegar a listagem de contas para o AccountsService', async () => {
    const mockAccounts = [{ id: 'acc-1', name: 'Nubank', userId }];

    const service = {
      findAll: vi.fn().mockResolvedValue(mockAccounts),
    } as unknown as AccountsService;

    const controller = new AccountsController(service);
    const result = await controller.findAll(userId);

    expect(service.findAll).toHaveBeenCalledWith(userId);
    expect(result).toEqual(mockAccounts);
  });

  it('deve delegar a busca por id para o AccountsService', async () => {
    const mockAccount = { id: 'acc-1', name: 'Nubank', userId };

    const service = {
      findById: vi.fn().mockResolvedValue(mockAccount),
    } as unknown as AccountsService;

    const controller = new AccountsController(service);
    const result = await controller.findOne(userId, 'acc-1');

    expect(service.findById).toHaveBeenCalledWith(userId, 'acc-1');
    expect(result).toEqual(mockAccount);
  });

  it('deve delegar a atualização para o AccountsService', async () => {
    const mockAccount = { id: 'acc-1', name: 'Nubank PJ', userId };

    const service = {
      update: vi.fn().mockResolvedValue(mockAccount),
    } as unknown as AccountsService;

    const controller = new AccountsController(service);
    const dto = { name: 'Nubank PJ' };

    const result = await controller.update(userId, 'acc-1', dto);

    expect(service.update).toHaveBeenCalledWith(userId, 'acc-1', dto);
    expect(result).toEqual(mockAccount);
  });

  it('deve delegar a remoção para o AccountsService', async () => {
    const mockResponse = { message: 'Conta removida com sucesso' };

    const service = {
      remove: vi.fn().mockResolvedValue(mockResponse),
    } as unknown as AccountsService;

    const controller = new AccountsController(service);
    const result = await controller.remove(userId, 'acc-1');

    expect(service.remove).toHaveBeenCalledWith(userId, 'acc-1');
    expect(result).toEqual(mockResponse);
  });
});
