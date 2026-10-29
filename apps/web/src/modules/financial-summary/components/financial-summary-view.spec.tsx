import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { renderWithProviders } from "@/test/test-utils";
import { FinancialSummaryView } from "./financial-summary-view";
import { financialSummaryService } from "../services/financial-summary.service";
import type {
  CategorySummary,
  FinancialOverview,
  MonthlyEvolution,
} from "../types/financial-summary";

vi.mock("../services/financial-summary.service", () => ({
  financialSummaryService: {
    getOverview: vi.fn(),
    getByCategory: vi.fn(),
    getMonthlyEvolution: vi.fn(),
  },
}));

describe("FinancialSummaryView Component", () => {
  const mockOverview: FinancialOverview = {
    currentBalance: 5000,
    totalIncome: 7000,
    totalExpense: 2000,
    netBalance: 5000,
    incomeCount: 2,
    expenseCount: 4,
  };

  const mockCategorySummary: CategorySummary = {
    type: "EXPENSE",
    totalAmount: 2000,
    categories: [
      {
        categoryId: "cat-1",
        categoryName: "Moradia",
        amount: 1500,
        percentage: 75,
        count: 1,
      },
      {
        categoryId: "cat-2",
        categoryName: "Lazer",
        amount: 500,
        percentage: 25,
        count: 3,
      },
    ],
  };

  const mockEvolution: MonthlyEvolution = {
    year: 2026,
    totalIncome: 14000,
    totalExpense: 4000,
    netTotal: 10000,
    months: [
      {
        month: 1,
        monthName: "Jan",
        income: 7000,
        expense: 2000,
        net: 5000,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve integrar e carregar os dados de overview, categorias e evolução", async () => {
    vi.mocked(financialSummaryService.getOverview).mockResolvedValueOnce(mockOverview);
    vi.mocked(financialSummaryService.getByCategory).mockResolvedValueOnce(mockCategorySummary);
    vi.mocked(financialSummaryService.getMonthlyEvolution).mockResolvedValueOnce(mockEvolution);

    renderWithProviders(<FinancialSummaryView initialYear={2026} />);

    expect(screen.getByTestId("financial-summary-view")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("financial-overview-balance")).toHaveTextContent("5.000,00");
      expect(screen.getByText("Moradia")).toBeInTheDocument();
      expect(screen.getByText("Lazer")).toBeInTheDocument();
      expect(screen.getByText("Evolução Mensal (2026)")).toBeInTheDocument();
    });
  });
});
