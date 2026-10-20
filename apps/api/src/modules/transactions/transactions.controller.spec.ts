import { TransactionType } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { TransactionsController } from './transactions.controller.js';
import type { TransactionsService } from './transactions.service.js';

describe('TransactionsController', () => {
  const userId = 'user-1';

  it('deve delegar a criação de transação para o TransactionsService', async () => {
    const mockTx = {
      id: 'tx-1',
      description: 'Supermercado',
      amount: 150.5,
      type: TransactionType.EXPENSE,
      date: new Date('2026-10-20'),
      notes: 'Compras semanais',
      userId,
      categoryId: 'cat-1',
      accountId: 'acc-1',
    };

    const service = {
      create: vi.fn().mockResolvedValue(mockTx),
    } as unknown as TransactionsService;

    const controller = new TransactionsController(service);
    const dto = {
      description: 'Supermercado',
      amount: 150.5,
      type: TransactionType.EXPENSE,
      date: '2026-10-20',
      notes: 'Compras semanais',
      categoryId: 'cat-1',
      accountId: 'acc-1',
    };

    const result = await controller.create(userId, dto);

    expect(service.create).toHaveBeenCalledWith(userId, dto);
    expect(result).toEqual(mockTx);
  });

  it('deve delegar a listagem de transações com filtros para o TransactionsService', async () => {
    const mockTransactions = [{ id: 'tx-1', description: 'Salário', amount: 5000, userId }];

    const service = {
      findAll: vi.fn().mockResolvedValue(mockTransactions),
    } as unknown as TransactionsService;

    const controller = new TransactionsController(service);
    const filter = {
      type: TransactionType.INCOME,
      page: 1,
      limit: 10,
    };

    const result = await controller.findAll(userId, filter);

    expect(service.findAll).toHaveBeenCalledWith(userId, filter);
    expect(result).toEqual(mockTransactions);
  });

  it('deve delegar a busca por id para o TransactionsService', async () => {
    const mockTx = { id: 'tx-1', description: 'Almoço', userId };

    const service = {
      findById: vi.fn().mockResolvedValue(mockTx),
    } as unknown as TransactionsService;

    const controller = new TransactionsController(service);
    const result = await controller.findOne(userId, 'tx-1');

    expect(service.findById).toHaveBeenCalledWith(userId, 'tx-1');
    expect(result).toEqual(mockTx);
  });

  it('deve delegar a atualização para o TransactionsService', async () => {
    const mockTx = { id: 'tx-1', description: 'Jantar', amount: 90, userId };

    const service = {
      update: vi.fn().mockResolvedValue(mockTx),
    } as unknown as TransactionsService;

    const controller = new TransactionsController(service);
    const dto = { description: 'Jantar', amount: 90 };

    const result = await controller.update(userId, 'tx-1', dto);

    expect(service.update).toHaveBeenCalledWith(userId, 'tx-1', dto);
    expect(result).toEqual(mockTx);
  });

  it('deve delegar a remoção para o TransactionsService', async () => {
    const mockResponse = { message: 'Transação removida com sucesso' };

    const service = {
      remove: vi.fn().mockResolvedValue(mockResponse),
    } as unknown as TransactionsService;

    const controller = new TransactionsController(service);
    const result = await controller.remove(userId, 'tx-1');

    expect(service.remove).toHaveBeenCalledWith(userId, 'tx-1');
    expect(result).toEqual(mockResponse);
  });
});
