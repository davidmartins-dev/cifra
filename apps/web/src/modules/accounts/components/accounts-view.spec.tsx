import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { renderWithProviders } from "@/test/test-utils";
import { AccountsView } from "./accounts-view";
import { accountsService } from "../services/accounts.service";
import { AccountType, type Account } from "../types/account";

vi.mock("../services/accounts.service", () => ({
  accountsService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("AccountsView Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o título e o estado vazio quando não houver contas cadastradas", async () => {
    vi.mocked(accountsService.list).mockResolvedValueOnce([]);

    renderWithProviders(<AccountsView />);

    expect(screen.getByText("Minhas Contas")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("accounts-empty-state")).toBeInTheDocument();
      expect(screen.getByText("Nenhuma conta cadastrada")).toBeInTheDocument();
    });

    expect(screen.getByTestId("total-balance-value")).toHaveTextContent("R$ 0,00");
    expect(screen.getByTestId("accounts-count-value")).toHaveTextContent("0");
  });

  it("deve calcular e renderizar o saldo consolidado e os cards das contas", async () => {
    const mockAccounts: Account[] = [
      {
        id: "acc-1",
        name: "Nubank",
        type: AccountType.CHECKING,
        balance: 2000,
        userId: "user-1",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "acc-2",
        name: "XP Investimentos",
        type: AccountType.INVESTMENT,
        balance: 8000,
        userId: "user-1",
        createdAt: "2026-01-02T00:00:00Z",
        updatedAt: "2026-01-02T00:00:00Z",
      },
    ];

    vi.mocked(accountsService.list).mockResolvedValueOnce(mockAccounts);

    renderWithProviders(<AccountsView />);

    await waitFor(() => {
      expect(screen.getByTestId("accounts-grid")).toBeInTheDocument();
    });

    // Saldo Consolidado: 2000 + 8000 = 10000
    expect(screen.getByTestId("total-balance-value")).toHaveTextContent("10.000,00");
    expect(screen.getByTestId("accounts-count-value")).toHaveTextContent("2");
    expect(screen.getByText("Nubank")).toBeInTheDocument();
    expect(screen.getByText("XP Investimentos")).toBeInTheDocument();
  });

  it("deve abrir o modal de nova conta ao clicar no botão Nova Conta", async () => {
    const user = userEvent.setup();
    vi.mocked(accountsService.list).mockResolvedValueOnce([]);

    renderWithProviders(<AccountsView />);

    const newAccountButton = screen.getByTestId("open-create-account-button");
    await user.click(newAccountButton);

    await waitFor(() => {
      expect(screen.getByTestId("account-form-dialog")).toBeInTheDocument();
      expect(screen.getByText("Nova Conta Financeira")).toBeInTheDocument();
    });
  });
});
