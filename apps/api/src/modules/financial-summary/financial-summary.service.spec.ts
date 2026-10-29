import { NotFoundException } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../shared/database/prisma.service.js';
import { FinancialSummaryService } from './financial-summary.service.js';

describe('FinancialSummaryService', () => {
  const userId = 'user-1';

  describe('getOverview', () => {
    it('deve retornar o resumo geral com saldo atual, receitas, despesas e saldo líquido', async () => {
      const mockAccounts = [{ balance: 1500.5 }, { balance: 499.5 }];

      const mockIncomeAgg = {
        _sum: { amount: 5000 },
        _count: { id: 2 },
      };

      const mockExpenseAgg = {
        _sum: { amount: 2000 },
        _count: { id: 5 },
      };

      const aggregateMock = vi
        .fn()
        .mockResolvedValueOnce(mockIncomeAgg)
        .mockResolvedValueOnce(mockExpenseAgg);

      const prisma = {
        account: {
          findMany: vi.fn().mockResolvedValue(mockAccounts),
        },
        transaction: {
          aggregate: aggregateMock,
        },
      } as unknown as PrismaService;

      const service = new FinancialSummaryService(prisma);
      const result = await service.getOverview(userId);

      expect(prisma.account.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: { balance: true },
      });
      expect(aggregateMock).toHaveBeenNthCalledWith(1, {
        where: { userId, type: TransactionType.INCOME },
        _sum: { amount: true },
        _count: { id: true },
      });
      expect(aggregateMock).toHaveBeenNthCalledWith(2, {
        where: { userId, type: TransactionType.EXPENSE },
        _sum: { amount: true },
        _count: { id: true },
      });
      expect(result).toEqual({
        currentBalance: 2000,
        totalIncome: 5000,
        totalExpense: 2000,
        netBalance: 3000,
        incomeCount: 2,
        expenseCount: 5,
      });
    });

    it('deve aplicar filtros de período completo e conta ao buscar o resumo geral', async () => {
      const mockAccount = { id: 'acc-1', userId };
      const aggregateMock = vi.fn().mockResolvedValue({
        _sum: { amount: null },
        _count: { id: 0 },
      });

      const prisma = {
        account: {
          findFirst: vi.fn().mockResolvedValue(mockAccount),
          findMany: vi.fn().mockResolvedValue([{ balance: 800 }]),
        },
        transaction: {
          aggregate: aggregateMock,
        },
      } as unknown as PrismaService;

      const service = new FinancialSummaryService(prisma);
      const query = {
        startDate: '2026-10-01T00:00:00.000Z',
        endDate: '2026-10-31T23:59:59.999Z',
        accountId: 'acc-1',
      };

      const result = await service.getOverview(userId, query);

      expect(prisma.account.findFirst).toHaveBeenCalledWith({
        where: { id: 'acc-1', userId },
      });
      expect(prisma.account.findMany).toHaveBeenCalledWith({
        where: { userId, id: 'acc-1' },
        select: { balance: true },
      });
      expect(aggregateMock).toHaveBeenCalledWith({
        where: {
          userId,
          accountId: 'acc-1',
          type: TransactionType.INCOME,
          date: {
            gte: new Date('2026-10-01T00:00:00.000Z'),
            lte: new Date('2026-10-31T23:59:59.999Z'),
          },
        },
        _sum: { amount: true },
        _count: { id: true },
      });
      expect(result).toEqual({
        currentBalance: 800,
        totalIncome: 0,
        totalExpense: 0,
        netBalance: 0,
        incomeCount: 0,
        expenseCount: 0,
      });
    });

    it('deve aplicar apenas filtro de startDate quando endDate não for informado no resumo geral', async () => {
      const aggregateMock = vi.fn().mockResolvedValue({
        _sum: { amount: 150 },
        _count: { id: 1 },
      });

      const prisma = {
        account: {
          findMany: vi.fn().mockResolvedValue([]),
        },
        transaction: {
          aggregate: aggregateMock,
        },
      } as unknown as PrismaService;

      const service = new FinancialSummaryService(prisma);
      await service.getOverview(userId, { startDate: '2026-05-01T00:00:00.000Z' });

      expect(aggregateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            date: {
              gte: new Date('2026-05-01T00:00:00.000Z'),
            },
          }),
        }),
      );
    });

    it('deve aplicar apenas filtro de endDate quando startDate não for informado no resumo geral', async () => {
      const aggregateMock = vi.fn().mockResolvedValue({
        _sum: { amount: 200 },
        _count: { id: 2 },
      });

      const prisma = {
        account: {
          findMany: vi.fn().mockResolvedValue([]),
        },
        transaction: {
          aggregate: aggregateMock,
        },
      } as unknown as PrismaService;

      const service = new FinancialSummaryService(prisma);
      await service.getOverview(userId, { endDate: '2026-06-30T23:59:59.999Z' });

      expect(aggregateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            date: {
              lte: new Date('2026-06-30T23:59:59.999Z'),
            },
          }),
        }),
      );
    });

    it('deve lançar NotFoundException se a conta fornecida no filtro não pertencer ao usuário', async () => {
      const prisma = {
        account: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      } as unknown as PrismaService;

      const service = new FinancialSummaryService(prisma);

      await expect(
        service.getOverview(userId, { accountId: 'acc-alheia' }),
      ).rejects.toThrow('Conta financeira não encontrada');
    });
  });

  describe('getByCategory', () => {
    it('deve retornar agrupamento por categoria com valores e percentuais calculados e tratar categoria desconhecida', async () => {
      const mockGrouped = [
        { categoryId: 'cat-1', _sum: { amount: 300 }, _count: { id: 3 } },
        { categoryId: 'cat-2', _sum: { amount: 100 }, _count: { id: 1 } },
        { categoryId: 'cat-inexistente', _sum: { amount: 100 }, _count: { id: 1 } },
      ];

      const mockCategories = [
        { id: 'cat-1', name: 'Alimentação' },
        { id: 'cat-2', name: 'Transporte' },
      ];

      const prisma = {
        transaction: {
          groupBy: vi.fn().mockResolvedValue(mockGrouped),
        },
        category: {
          findMany: vi.fn().mockResolvedValue(mockCategories),
        },
      } as unknown as PrismaService;

      const service = new FinancialSummaryService(prisma);
      const result = await service.getByCategory(userId);

      expect(prisma.transaction.groupBy).toHaveBeenCalledWith({
        by: ['categoryId'],
        where: { userId, type: TransactionType.EXPENSE },
        _sum: { amount: true },
        _count: { id: true },
      });
      expect(result).toEqual({
        type: TransactionType.EXPENSE,
        totalAmount: 500,
        categories: [
          {
            categoryId: 'cat-1',
            categoryName: 'Alimentação',
            amount: 300,
            percentage: 60,
            count: 3,
          },
          {
            categoryId: 'cat-2',
            categoryName: 'Transporte',
            amount: 100,
            percentage: 20,
            count: 1,
          },
          {
            categoryId: 'cat-inexistente',
            categoryName: 'Categoria desconhecida',
            amount: 100,
            percentage: 20,
            count: 1,
          },
        ],
      });
    });

    it('deve aplicar filtros de conta, tipo, startDate e endDate no getByCategory', async () => {
      const mockAccount = { id: 'acc-1', userId };
      const groupByMock = vi.fn().mockResolvedValue([]);

      const prisma = {
        account: {
          findFirst: vi.fn().mockResolvedValue(mockAccount),
        },
        transaction: {
          groupBy: groupByMock,
        },
        category: {
          findMany: vi.fn(),
        },
      } as unknown as PrismaService;

      const service = new FinancialSummaryService(prisma);
      const query = {
        accountId: 'acc-1',
        type: TransactionType.INCOME,
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-01-31T23:59:59.999Z',
      };

      await service.getByCategory(userId, query);

      expect(prisma.account.findFirst).toHaveBeenCalledWith({
        where: { id: 'acc-1', userId },
      });
      expect(groupByMock).toHaveBeenCalledWith({
        by: ['categoryId'],
        where: {
          userId,
          type: TransactionType.INCOME,
          accountId: 'acc-1',
          date: {
            gte: new Date('2026-01-01T00:00:00.000Z'),
            lte: new Date('2026-01-31T23:59:59.999Z'),
          },
        },
        _sum: { amount: true },
        _count: { id: true },
      });
    });

    it('deve aplicar filtro de apenas startDate no getByCategory', async () => {
      const groupByMock = vi.fn().mockResolvedValue([]);

      const prisma = {
        transaction: {
          groupBy: groupByMock,
        },
        category: {
          findMany: vi.fn(),
        },
      } as unknown as PrismaService;

      const service = new FinancialSummaryService(prisma);
      await service.getByCategory(userId, { startDate: '2026-02-01T00:00:00.000Z' });

      expect(groupByMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            date: {
              gte: new Date('2026-02-01T00:00:00.000Z'),
            },
          }),
        }),
      );
    });

    it('deve aplicar filtro de apenas endDate no getByCategory', async () => {
      const groupByMock = vi.fn().mockResolvedValue([]);

      const prisma = {
        transaction: {
          groupBy: groupByMock,
        },
        category: {
          findMany: vi.fn(),
        },
      } as unknown as PrismaService;

      const service = new FinancialSummaryService(prisma);
      await service.getByCategory(userId, { endDate: '2026-03-31T23:59:59.999Z' });

      expect(groupByMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            date: {
              lte: new Date('2026-03-31T23:59:59.999Z'),
            },
          }),
        }),
      );
    });

    it('deve retornar percentual zero e array vazio quando não houver transações', async () => {
      const prisma = {
        transaction: {
          groupBy: vi.fn().mockResolvedValue([]),
        },
        category: {
          findMany: vi.fn(),
        },
      } as unknown as PrismaService;

      const service = new FinancialSummaryService(prisma);
      const result = await service.getByCategory(userId, { type: TransactionType.INCOME });

      expect(prisma.category.findMany).not.toHaveBeenCalled();
      expect(result).toEqual({
        type: TransactionType.INCOME,
        totalAmount: 0,
        categories: [],
      });
    });

    it('deve validar ownership da conta no getByCategory', async () => {
      const prisma = {
        account: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      } as unknown as PrismaService;

      const service = new FinancialSummaryService(prisma);

      await expect(
        service.getByCategory(userId, { accountId: 'acc-invalida' }),
      ).rejects.toThrow('Conta financeira não encontrada');
    });
  });

  describe('getMonthlyEvolution', () => {
    it('deve calcular a evolução mensal de receitas e despesas ao longo dos 12 meses', async () => {
      const mockTransactions = [
        {
          amount: 3500,
          type: TransactionType.INCOME,
          date: new Date(Date.UTC(2026, 0, 15)), // Janeiro
        },
        {
          amount: 1200,
          type: TransactionType.EXPENSE,
          date: new Date(Date.UTC(2026, 0, 20)), // Janeiro
        },
        {
          amount: 800,
          type: TransactionType.EXPENSE,
          date: new Date(Date.UTC(2026, 1, 10)), // Fevereiro
        },
      ];

      const prisma = {
        transaction: {
          findMany: vi.fn().mockResolvedValue(mockTransactions),
        },
      } as unknown as PrismaService;

      const service = new FinancialSummaryService(prisma);
      const result = await service.getMonthlyEvolution(userId, { year: 2026 });

      expect(prisma.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          date: {
            gte: new Date(Date.UTC(2026, 0, 1, 0, 0, 0, 0)),
            lte: new Date(Date.UTC(2026, 11, 31, 23, 59, 59, 999)),
          },
        },
        select: {
          amount: true,
          type: true,
          date: true,
        },
      });

      expect(result.year).toBe(2026);
      expect(result.totalIncome).toBe(3500);
      expect(result.totalExpense).toBe(2000);
      expect(result.netTotal).toBe(1500);
      expect(result.months.length).toBe(12);

      // Janeiro
      expect(result.months[0]).toEqual({
        month: 1,
        monthName: 'Janeiro',
        income: 3500,
        expense: 1200,
        net: 2300,
      });

      // Fevereiro
      expect(result.months[1]).toEqual({
        month: 2,
        monthName: 'Fevereiro',
        income: 0,
        expense: 800,
        net: -800,
      });

      // Março (sem movimentação)
      expect(result.months[2]).toEqual({
        month: 3,
        monthName: 'Março',
        income: 0,
        expense: 0,
        net: 0,
      });
    });

    it('deve usar o ano atual se o ano não for informado', async () => {
      const currentYear = new Date().getFullYear();

      const prisma = {
        transaction: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      } as unknown as PrismaService;

      const service = new FinancialSummaryService(prisma);
      const result = await service.getMonthlyEvolution(userId);

      expect(prisma.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          date: {
            gte: new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0, 0)),
            lte: new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59, 999)),
          },
        },
        select: {
          amount: true,
          type: true,
          date: true,
        },
      });

      expect(result.year).toBe(currentYear);
      expect(result.totalIncome).toBe(0);
      expect(result.totalExpense).toBe(0);
      expect(result.netTotal).toBe(0);
      expect(result.months.length).toBe(12);
    });
  });
});
