import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/test/test-utils";
import { financialSummaryService } from "../services/financial-summary.service";
import {
  useFinancialOverview,
  useCategorySummary,
  useMonthlyEvolution,
} from "./use-financial-summary";
import type {
  FinancialOverview,
  CategorySummary,
  MonthlyEvolution,
} from "../types/financial-summary";

vi.mock("../services/financial-summary.service", () => ({
  financialSummaryService: {
    getOverview: vi.fn(),
    getByCategory: vi.fn(),
    getMonthlyEvolution: vi.fn(),
  },
}));

describe("useFinancialSummary Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createWrapper = () => {
    const queryClient = createTestQueryClient();
    return function QueryWrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };
  };

  it("deve carregar o resumo geral financeiro com useFinancialOverview", async () => {
    const mockOverview: FinancialOverview = {
      currentBalance: 5000,
      totalIncome: 7000,
      totalExpense: 2000,
      netBalance: 5000,
      incomeCount: 3,
      expenseCount: 10,
    };

    vi.mocked(financialSummaryService.getOverview).mockResolvedValueOnce(mockOverview);

    const { result } = renderHook(() => useFinancialOverview(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockOverview);
    expect(financialSummaryService.getOverview).toHaveBeenCalledWith(undefined);
  });

  it("deve carregar a distribuição por categorias com useCategorySummary", async () => {
    const mockCategorySummary: CategorySummary = {
      type: "EXPENSE",
      totalAmount: 1500,
      categories: [
        {
          categoryId: "cat-1",
          categoryName: "Alimentação",
          amount: 1000,
          percentage: 66.67,
          count: 5,
        },
        {
          categoryId: "cat-2",
          categoryName: "Transporte",
          amount: 500,
          percentage: 33.33,
          count: 2,
        },
      ],
    };

    vi.mocked(financialSummaryService.getByCategory).mockResolvedValueOnce(mockCategorySummary);

    const { result } = renderHook(
      () => useCategorySummary({ type: "EXPENSE", accountId: "acc-1" }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockCategorySummary);
    expect(financialSummaryService.getByCategory).toHaveBeenCalledWith({
      type: "EXPENSE",
      accountId: "acc-1",
    });
  });

  it("deve carregar a evolução mensal anual com useMonthlyEvolution", async () => {
    const mockEvolution: MonthlyEvolution = {
      year: 2026,
      totalIncome: 12000,
      totalExpense: 8000,
      netTotal: 4000,
      months: [
        {
          month: 1,
          monthName: "Janeiro",
          income: 6000,
          expense: 4000,
          net: 2000,
        },
        {
          month: 2,
          monthName: "Fevereiro",
          income: 6000,
          expense: 4000,
          net: 2000,
        },
      ],
    };

    vi.mocked(financialSummaryService.getMonthlyEvolution).mockResolvedValueOnce(mockEvolution);

    const { result } = renderHook(
      () => useMonthlyEvolution({ year: 2026 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockEvolution);
    expect(financialSummaryService.getMonthlyEvolution).toHaveBeenCalledWith({
      year: 2026,
    });
  });
});
