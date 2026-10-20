import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../shared/database/prisma.service.js';
import { TransactionsService } from './transactions.service.js';

describe('TransactionsService', () => {
  const userId = 'user-1';

  it('deve criar uma transação com sucesso quando categoria e conta forem válidas e pertencerem ao usuário', async () => {
    const mockCategory = {
      id: 'cat-1',
      name: 'Salário',
      type: TransactionType.INCOME,
      userId,
    };

    const mockAccount = {
      id: 'acc-1',
      name: 'Conta Corrente',
      userId,
    };

    const createdTransaction = {
      id: 'tx-1',
      description: 'Salário de Outubro',
      amount: 5000,
      type: TransactionType.INCOME,
      date: new Date('2026-10-05T00:00:00.000Z'),
      notes: 'Bônus incluído',
      userId,
      categoryId: 'cat-1',
      accountId: 'acc-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      category: mockCategory,
      account: mockAccount,
    };

    const prisma = {
      category: {
        findFirst: vi.fn().mockResolvedValue(mockCategory),
      },
      account: {
        findFirst: vi.fn().mockResolvedValue(mockAccount),
      },
      transaction: {
        create: vi.fn().mockResolvedValue(createdTransaction),
      },
    } as unknown as PrismaService;

    const service = new TransactionsService(prisma);
    const dto = {
      description: '  Salário de Outubro  ',
      amount: 5000,
      type: TransactionType.INCOME,
      date: '2026-10-05T00:00:00.000Z',
      notes: '  Bônus incluído  ',
      categoryId: 'cat-1',
      accountId: 'acc-1',
    };

    const result = await service.create(userId, dto);

    expect(prisma.category.findFirst).toHaveBeenCalledWith({
      where: { id: 'cat-1', userId },
    });
    expect(prisma.account.findFirst).toHaveBeenCalledWith({
      where: { id: 'acc-1', userId },
    });
    expect(prisma.transaction.create).toHaveBeenCalledWith({
      data: {
        description: 'Salário de Outubro',
        amount: 5000,
        type: TransactionType.INCOME,
        date: new Date('2026-10-05T00:00:00.000Z'),
        notes: 'Bônus incluído',
        userId,
        categoryId: 'cat-1',
        accountId: 'acc-1',
      },
      include: {
        category: true,
        account: true,
      },
    });
    expect(result).toEqual(createdTransaction);
  });

  it('deve criar uma transação sem conta (accountId opcional)', async () => {
    const mockCategory = {
      id: 'cat-2',
      name: 'Supermercado',
      type: TransactionType.EXPENSE,
      userId,
    };

    const createdTransaction = {
      id: 'tx-2',
      description: 'Compras',
      amount: 150,
      type: TransactionType.EXPENSE,
      date: new Date('2026-10-10T12:00:00.000Z'),
      notes: null,
      userId,
      categoryId: 'cat-2',
      accountId: null,
      category: mockCategory,
      account: null,
    };

    const prisma = {
      category: {
        findFirst: vi.fn().mockResolvedValue(mockCategory),
      },
      account: {
        findFirst: vi.fn(),
      },
      transaction: {
        create: vi.fn().mockResolvedValue(createdTransaction),
      },
    } as unknown as PrismaService;

    const service = new TransactionsService(prisma);
    const dto = {
      description: 'Compras',
      amount: 150,
      type: TransactionType.EXPENSE,
      date: '2026-10-10T12:00:00.000Z',
      categoryId: 'cat-2',
    };

    const result = await service.create(userId, dto);

    expect(prisma.account.findFirst).not.toHaveBeenCalled();
    expect(prisma.transaction.create).toHaveBeenCalledWith({
      data: {
        description: 'Compras',
        amount: 150,
        type: TransactionType.EXPENSE,
        date: new Date('2026-10-10T12:00:00.000Z'),
        notes: null,
        userId,
        categoryId: 'cat-2',
        accountId: null,
      },
      include: {
        category: true,
        account: true,
      },
    });
    expect(result).toEqual(createdTransaction);
  });

  it('deve lançar NotFoundException se a categoria não pertencer ao usuário logado ou não existir', async () => {
    const prisma = {
      category: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaService;

    const service = new TransactionsService(prisma);
    const dto = {
      description: 'Teste',
      amount: 50,
      type: TransactionType.EXPENSE,
      date: '2026-10-10T00:00:00.000Z',
      categoryId: 'cat-alheia',
    };

    await expect(service.create(userId, dto)).rejects.toThrow(NotFoundException);
    expect(prisma.category.findFirst).toHaveBeenCalledWith({
      where: { id: 'cat-alheia', userId },
    });
  });

  it('deve lançar BadRequestException se o tipo da transação for diferente do tipo da categoria', async () => {
    const mockCategory = {
      id: 'cat-1',
      name: 'Salário',
      type: TransactionType.INCOME,
      userId,
    };

    const prisma = {
      category: {
        findFirst: vi.fn().mockResolvedValue(mockCategory),
      },
    } as unknown as PrismaService;

    const service = new TransactionsService(prisma);
    const dto = {
      description: 'Despesa em categoria de receita',
      amount: 100,
      type: TransactionType.EXPENSE,
      date: '2026-10-10T00:00:00.000Z',
      categoryId: 'cat-1',
    };

    await expect(service.create(userId, dto)).rejects.toThrow(BadRequestException);
  });

  it('deve lançar NotFoundException se accountId for informado mas pertencer a outro usuário ou não existir', async () => {
    const mockCategory = {
      id: 'cat-1',
      name: 'Supermercado',
      type: TransactionType.EXPENSE,
      userId,
    };

    const prisma = {
      category: {
        findFirst: vi.fn().mockResolvedValue(mockCategory),
      },
      account: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaService;

    const service = new TransactionsService(prisma);
    const dto = {
      description: 'Supermercado',
      amount: 100,
      type: TransactionType.EXPENSE,
      date: '2026-10-10T00:00:00.000Z',
      categoryId: 'cat-1',
      accountId: 'acc-alheia',
    };

    await expect(service.create(userId, dto)).rejects.toThrow(NotFoundException);
    expect(prisma.account.findFirst).toHaveBeenCalledWith({
      where: { id: 'acc-alheia', userId },
    });
  });

  it('deve listar as transações do usuário aplicando filtros e ordenação por data desc', async () => {
    const mockTransactions = [
      { id: 'tx-2', description: 'Mercado', amount: 80, date: new Date('2026-10-15') },
      { id: 'tx-1', description: 'Padaria', amount: 20, date: new Date('2026-10-10') },
    ];

    const prisma = {
      transaction: {
        findMany: vi.fn().mockResolvedValue(mockTransactions),
      },
    } as unknown as PrismaService;

    const service = new TransactionsService(prisma);
    const filter = {
      type: TransactionType.EXPENSE,
      categoryId: 'cat-1',
      accountId: 'acc-1',
      startDate: '2026-10-01T00:00:00.000Z',
      endDate: '2026-10-31T23:59:59.999Z',
      page: 2,
      limit: 10,
    };

    const result = await service.findAll(userId, filter);

    expect(prisma.transaction.findMany).toHaveBeenCalledWith({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: {
          gte: new Date('2026-10-01T00:00:00.000Z'),
          lte: new Date('2026-10-31T23:59:59.999Z'),
        },
      },
      include: {
        category: true,
        account: true,
      },
      orderBy: { date: 'desc' },
      take: 10,
      skip: 10,
    });
    expect(result).toEqual(mockTransactions);
  });

  it('deve buscar uma transação por id com sucesso', async () => {
    const mockTx = {
      id: 'tx-1',
      description: 'Luz',
      amount: 150,
      userId,
      category: { id: 'cat-1', name: 'Contas' },
      account: null,
    };

    const prisma = {
      transaction: {
        findFirst: vi.fn().mockResolvedValue(mockTx),
      },
    } as unknown as PrismaService;

    const service = new TransactionsService(prisma);
    const result = await service.findById(userId, 'tx-1');

    expect(prisma.transaction.findFirst).toHaveBeenCalledWith({
      where: { id: 'tx-1', userId },
      include: {
        category: true,
        account: true,
      },
    });
    expect(result).toEqual(mockTx);
  });

  it('deve lançar NotFoundException em findById se a transação não existir ou pertencer a outro usuário', async () => {
    const prisma = {
      transaction: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaService;

    const service = new TransactionsService(prisma);

    await expect(service.findById(userId, 'tx-999')).rejects.toThrow(NotFoundException);
  });

  it('deve atualizar uma transação com sucesso', async () => {
    const currentTx = {
      id: 'tx-1',
      description: 'Luz',
      amount: 150,
      type: TransactionType.EXPENSE,
      date: new Date('2026-10-01'),
      notes: null,
      userId,
      categoryId: 'cat-1',
      accountId: 'acc-1',
    };

    const updatedTx = {
      ...currentTx,
      description: 'Conta de Energia',
      amount: 175,
    };

    const prisma = {
      transaction: {
        findFirst: vi.fn().mockResolvedValue(currentTx),
        update: vi.fn().mockResolvedValue(updatedTx),
      },
    } as unknown as PrismaService;

    const service = new TransactionsService(prisma);
    const result = await service.update(userId, 'tx-1', {
      description: '  Conta de Energia  ',
      amount: 175,
    });

    expect(prisma.transaction.update).toHaveBeenCalledWith({
      where: { id: 'tx-1' },
      data: {
        description: 'Conta de Energia',
        amount: 175,
      },
      include: {
        category: true,
        account: true,
      },
    });
    expect(result).toEqual(updatedTx);
  });

  it('deve validar compatibilidade de categoria e tipo durante a atualização', async () => {
    const currentTx = {
      id: 'tx-1',
      description: 'Almoço',
      amount: 50,
      type: TransactionType.EXPENSE,
      date: new Date('2026-10-01'),
      userId,
      categoryId: 'cat-exp',
      accountId: null,
    };

    const mockCategory = {
      id: 'cat-inc',
      name: 'Investimentos',
      type: TransactionType.INCOME,
      userId,
    };

    const prisma = {
      transaction: {
        findFirst: vi.fn().mockResolvedValue(currentTx),
      },
      category: {
        findFirst: vi.fn().mockResolvedValue(mockCategory),
      },
    } as unknown as PrismaService;

    const service = new TransactionsService(prisma);

    // Tentar trocar para uma categoria de INCOME mantendo type EXPENSE da transação
    await expect(
      service.update(userId, 'tx-1', { categoryId: 'cat-inc' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve lançar NotFoundException na atualização se o novo accountId não pertencer ao usuário', async () => {
    const currentTx = {
      id: 'tx-1',
      description: 'Almoço',
      amount: 50,
      type: TransactionType.EXPENSE,
      date: new Date('2026-10-01'),
      userId,
      categoryId: 'cat-1',
      accountId: null,
    };

    const prisma = {
      transaction: {
        findFirst: vi.fn().mockResolvedValue(currentTx),
      },
      account: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaService;

    const service = new TransactionsService(prisma);

    await expect(
      service.update(userId, 'tx-1', { accountId: 'acc-alheio' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('deve remover uma transação com sucesso', async () => {
    const mockTx = {
      id: 'tx-1',
      userId,
    };

    const prisma = {
      transaction: {
        findFirst: vi.fn().mockResolvedValue(mockTx),
        delete: vi.fn().mockResolvedValue(mockTx),
      },
    } as unknown as PrismaService;

    const service = new TransactionsService(prisma);
    const result = await service.remove(userId, 'tx-1');

    expect(prisma.transaction.delete).toHaveBeenCalledWith({
      where: { id: 'tx-1' },
    });
    expect(result).toEqual({ message: 'Transação removida com sucesso' });
  });

  it('deve lançar NotFoundException em remove se a transação não existir', async () => {
    const prisma = {
      transaction: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaService;

    const service = new TransactionsService(prisma);

    await expect(service.remove(userId, 'tx-999')).rejects.toThrow(NotFoundException);
  });
});
