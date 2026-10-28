import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { TransactionFormDialog } from "./transaction-form-dialog";
import { TransactionType, type Transaction } from "../types/transaction";
import { maskCurrencyBRL } from "@/utils/masks";

vi.mock("@/modules/categories/hooks/use-categories", () => ({
  useCategories: () => ({
    data: [
      { id: "cat-1", name: "Salário", type: "INCOME" },
      { id: "cat-2", name: "Alimentação", type: "EXPENSE" },
    ],
    isLoading: false,
  }),
}));

vi.mock("@/modules/accounts/hooks/use-accounts", () => ({
  useAccounts: () => ({
    data: [{ id: "acc-1", name: "Nubank", balance: 1000 }],
    isLoading: false,
  }),
}));

describe("TransactionFormDialog Component", () => {
  it("deve renderizar modal de criação com valores padrão", () => {
    render(
      <TransactionFormDialog
        open={true}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText("Nova Transação")).toBeInTheDocument();
    expect(screen.getByTestId("transaction-description-input")).toHaveValue("");
    expect(screen.getByTestId("transaction-amount-input")).toHaveValue(maskCurrencyBRL(0));
    expect(screen.getByTestId("transaction-submit-button")).toHaveTextContent("Criar Transação");
  });

  it("deve renderizar modal de edição com dados pré-preenchidos", () => {
    const transactionToEdit: Transaction = {
      id: "tx-1",
      description: "Restaurante",
      amount: 85.5,
      type: TransactionType.EXPENSE,
      date: "2026-10-12T00:00:00Z",
      userId: "user-1",
      categoryId: "cat-2",
      accountId: "acc-1",
      createdAt: "2026-10-12T00:00:00Z",
      updatedAt: "2026-10-12T00:00:00Z",
    };

    render(
      <TransactionFormDialog
        open={true}
        onOpenChange={vi.fn()}
        transactionToEdit={transactionToEdit}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText("Editar Transação")).toBeInTheDocument();
    expect(screen.getByTestId("transaction-description-input")).toHaveValue("Restaurante");
    expect(screen.getByTestId("transaction-amount-input")).toHaveValue(maskCurrencyBRL(85.5));
    expect(screen.getByTestId("transaction-submit-button")).toHaveTextContent("Salvar Alterações");
  });

  it("deve exibir erro de validação ao submeter sem descrição", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <TransactionFormDialog
        open={true}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />
    );

    const submitBtn = screen.getByTestId("transaction-submit-button");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId("transaction-description-error")).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
