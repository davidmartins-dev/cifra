import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { renderWithProviders } from "@/test/test-utils";
import DashboardPage from "./page";
import { financialSummaryService } from "@/modules/financial-summary/services/financial-summary.service";
import type {
  CategorySummary,
  FinancialOverview,
  MonthlyEvolution,
} from "@/modules/financial-summary/types/financial-summary";
import type { User } from "@/modules/auth/types/auth";

const mockPush = vi.fn();
const mockLogout = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockUser: User = {
  id: "user-123",
  email: "david@cifra.app",
  name: "David Martins",
  role: "USER",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

vi.mock("@/modules/auth", () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout,
    isLoading: false,
    isAuthenticated: true,
  }),
}));

vi.mock("@/modules/financial-summary/services/financial-summary.service", () => ({
  financialSummaryService: {
    getOverview: vi.fn(),
    getByCategory: vi.fn(),
    getMonthlyEvolution: vi.fn(),
  },
}));

describe("DashboardPage Component", () => {

  const mockOverview: FinancialOverview = {
    currentBalance: 8500,
    totalIncome: 10000,
    totalExpense: 1500,
    netBalance: 8500,
    incomeCount: 2,
    expenseCount: 1,
  };

  const mockCategorySummary: CategorySummary = {
    type: "EXPENSE",
    totalAmount: 1500,
    categories: [
      {
        categoryId: "cat-1",
        categoryName: "Supermercado",
        amount: 1500,
        percentage: 100,
        count: 1,
      },
    ],
  };

  const mockEvolution: MonthlyEvolution = {
    year: 2026,
    totalIncome: 10000,
    totalExpense: 1500,
    netTotal: 8500,
    months: [
      {
        month: 10,
        monthName: "Out",
        income: 10000,
        expense: 1500,
        net: 8500,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar a saudação ao usuário e as métricas do resumo financeiro", async () => {
    vi.mocked(financialSummaryService.getOverview).mockResolvedValueOnce(mockOverview);
    vi.mocked(financialSummaryService.getByCategory).mockResolvedValueOnce(mockCategorySummary);
    vi.mocked(financialSummaryService.getMonthlyEvolution).mockResolvedValueOnce(mockEvolution);

    renderWithProviders(<DashboardPage />);

    expect(screen.getByRole("heading", { name: /olá, david martins!/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-current-balance")).toHaveTextContent("8.500,00");
      expect(screen.getByTestId("dashboard-total-income")).toHaveTextContent("10.000,00");
      expect(screen.getByTestId("dashboard-total-expense")).toHaveTextContent("1.500,00");
      expect(screen.getByTestId("dashboard-net-balance")).toHaveTextContent("8.500,00");
    });

    // Seção analítica
    expect(screen.getByText("Distribuição por Categorias")).toBeInTheDocument();
    expect(screen.getByText("Supermercado")).toBeInTheDocument();
    expect(screen.getByText("Evolução Mensal (2026)")).toBeInTheDocument();
  });

  it("deve permitir realizar logout redirecionando para a página de login", async () => {
    mockLogout.mockResolvedValueOnce(undefined);
    vi.mocked(financialSummaryService.getOverview).mockResolvedValueOnce(mockOverview);
    vi.mocked(financialSummaryService.getByCategory).mockResolvedValueOnce(mockCategorySummary);
    vi.mocked(financialSummaryService.getMonthlyEvolution).mockResolvedValueOnce(mockEvolution);

    const user = userEvent.setup();
    renderWithProviders(<DashboardPage />);

    const logoutButton = screen.getByRole("button", { name: /^sair$/i });
    await user.click(logoutButton);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });
});
