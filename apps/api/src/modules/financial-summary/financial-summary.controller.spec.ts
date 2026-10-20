import { TransactionType } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { FinancialSummaryController } from './financial-summary.controller.js';
import type { FinancialSummaryService } from './financial-summary.service.js';

describe('FinancialSummaryController', () => {
  const userId = 'user-1';

  it('deve delegar a busca do resumo geral para o FinancialSummaryService', async () => {
    const mockOverview = {
      currentBalance: 5000,
      totalIncome: 10000,
      totalExpense: 3000,
      netBalance: 7000,
      incomeCount: 2,
      expenseCount: 4,
    };

    const service = {
      getOverview: vi.fn().mockResolvedValue(mockOverview),
    } as unknown as FinancialSummaryService;

    const controller = new FinancialSummaryController(service);
    const query = { startDate: '2026-10-01', endDate: '2026-10-31' };

    const result = await controller.getOverview(userId, query);

    expect(service.getOverview).toHaveBeenCalledWith(userId, query);
    expect(result).toEqual(mockOverview);
  });

  it('deve delegar o resumo por categoria para o FinancialSummaryService', async () => {
    const mockByCategory = {
      type: TransactionType.EXPENSE,
      totalAmount: 1500,
      categories: [
        {
          categoryId: 'cat-1',
          categoryName: 'Alimentação',
          amount: 1500,
          percentage: 100,
          count: 2,
        },
      ],
    };

    const service = {
      getByCategory: vi.fn().mockResolvedValue(mockByCategory),
    } as unknown as FinancialSummaryService;

    const controller = new FinancialSummaryController(service);
    const query = { type: TransactionType.EXPENSE };

    const result = await controller.getByCategory(userId, query);

    expect(service.getByCategory).toHaveBeenCalledWith(userId, query);
    expect(result).toEqual(mockByCategory);
  });

  it('deve delegar a evolução mensal para o FinancialSummaryService', async () => {
    const mockEvolution = {
      year: 2026,
      totalIncome: 12000,
      totalExpense: 5000,
      netTotal: 7000,
      months: [],
    };

    const service = {
      getMonthlyEvolution: vi.fn().mockResolvedValue(mockEvolution),
    } as unknown as FinancialSummaryService;

    const controller = new FinancialSummaryController(service);
    const query = { year: 2026 };

    const result = await controller.getMonthlyEvolution(userId, query);

    expect(service.getMonthlyEvolution).toHaveBeenCalledWith(userId, query);
    expect(result).toEqual(mockEvolution);
  });
});
