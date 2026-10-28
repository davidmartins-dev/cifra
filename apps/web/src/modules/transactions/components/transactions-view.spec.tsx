import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { renderWithProviders } from "@/test/test-utils";
import { TransactionsView } from "./transactions-view";
import { transactionsService } from "../services/transactions.service";
import { TransactionType, type Transaction } from "../types/transaction";

vi.mock("../services/transactions.service", () => ({
  transactionsService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/modules/categories/services/categories.service", () => ({
  categoriesService: {
    list: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("@/modules/accounts/services/accounts.service", () => ({
  accountsService: {
    list: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("TransactionsView Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTransactions: Transaction[] = [
    {
      id: "tx-1",
      description: "Salário",
      amount: 4000,
      type: TransactionType.INCOME,
      date: "2026-10-01T00:00:00Z",
      userId: "user-1",
      categoryId: "cat-1",
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-01T00:00:00Z",
    },
    {
      id: "tx-2",
      description: "Supermercado",
      amount: 500,
      type: TransactionType.EXPENSE,
      date: "2026-10-02T00:00:00Z",
      userId: "user-1",
      categoryId: "cat-2",
      createdAt: "2026-10-02T00:00:00Z",
      updatedAt: "2026-10-02T00:00:00Z",
    },
  ];

  it("deve renderizar o título e o estado vazio quando não houver transações", async () => {
    vi.mocked(transactionsService.list).mockResolvedValueOnce([]);

    renderWithProviders(<TransactionsView />);

    expect(screen.getByText("Minhas Transações")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("transactions-empty-state")).toBeInTheDocument();
      expect(screen.getByText("Nenhuma transação encontrada")).toBeInTheDocument();
    });

    expect(screen.getByTestId("total-income-amount")).toHaveTextContent("R$ 0,00");
    expect(screen.getByTestId("total-expense-amount")).toHaveTextContent("R$ 0,00");
    expect(screen.getByTestId("net-balance-amount")).toHaveTextContent("R$ 0,00");
  });

  it("deve calcular e renderizar métricas e lista de transações", async () => {
    vi.mocked(transactionsService.list).mockResolvedValueOnce(mockTransactions);

    renderWithProviders(<TransactionsView />);

    await waitFor(() => {
      expect(screen.getByTestId("transactions-list")).toBeInTheDocument();
    });

    expect(screen.getByTestId("total-income-amount")).toHaveTextContent("R$ 4.000,00");
    expect(screen.getByTestId("total-expense-amount")).toHaveTextContent("R$ 500,00");
    expect(screen.getByTestId("net-balance-amount")).toHaveTextContent("R$ 3.500,00");

    expect(screen.getByText("Salário")).toBeInTheDocument();
    expect(screen.getByText("Supermercado")).toBeInTheDocument();
  });

  it("deve filtrar transações por tipo", async () => {
    const user = userEvent.setup();
    vi.mocked(transactionsService.list).mockResolvedValueOnce(mockTransactions);

    renderWithProviders(<TransactionsView />);

    await waitFor(() => {
      expect(screen.getByText("Salário")).toBeInTheDocument();
    });

    // Filtra apenas Receitas
    const filterIncomeBtn = screen.getByTestId("filter-income-button");
    await user.click(filterIncomeBtn);

    expect(screen.getByText("Salário")).toBeInTheDocument();
    expect(screen.queryByText("Supermercado")).not.toBeInTheDocument();

    // Filtra apenas Despesas
    const filterExpenseBtn = screen.getByTestId("filter-expense-button");
    await user.click(filterExpenseBtn);

    expect(screen.queryByText("Salário")).not.toBeInTheDocument();
    expect(screen.getByText("Supermercado")).toBeInTheDocument();
  });

  it("deve abrir o modal de nova transação ao clicar no botão Nova Transação", async () => {
    const user = userEvent.setup();
    vi.mocked(transactionsService.list).mockResolvedValueOnce([]);

    renderWithProviders(<TransactionsView />);

    await waitFor(() => {
      expect(screen.getByTestId("transactions-empty-state")).toBeInTheDocument();
    });

    const newBtn = screen.getByTestId("open-create-transaction-button");
    await user.click(newBtn);

    await waitFor(() => {
      expect(screen.getByTestId("transaction-form-dialog")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Nova Transação" })).toBeInTheDocument();
    });
  });
});
