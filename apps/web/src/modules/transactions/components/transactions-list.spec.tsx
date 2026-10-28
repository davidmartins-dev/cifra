import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { TransactionsList } from "./transactions-list";
import { TransactionType, type Transaction } from "../types/transaction";

describe("TransactionsList Component", () => {
  const mockTransactions: Transaction[] = [
    {
      id: "tx-1",
      description: "Salário Mensal",
      amount: 5000,
      type: TransactionType.INCOME,
      date: "2026-10-05T00:00:00Z",
      userId: "user-1",
      categoryId: "cat-1",
      createdAt: "2026-10-05T00:00:00Z",
      updatedAt: "2026-10-05T00:00:00Z",
    },
  ];

  it("deve renderizar estado de carregamento quando isLoading for true", () => {
    render(
      <TransactionsList
        transactions={[]}
        isLoading={true}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByTestId("transactions-loading")).toBeInTheDocument();
  });

  it("deve renderizar estado vazio quando lista estiver vazia", () => {
    render(
      <TransactionsList
        transactions={[]}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onOpenCreate={vi.fn()}
      />
    );

    expect(screen.getByTestId("transactions-empty-state")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma transação encontrada")).toBeInTheDocument();
    expect(screen.getByTestId("empty-create-transaction-button")).toBeInTheDocument();
  });

  it("deve renderizar lista de transações com itens", () => {
    render(
      <TransactionsList
        transactions={mockTransactions}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByTestId("transactions-list")).toBeInTheDocument();
    expect(screen.getByText("Salário Mensal")).toBeInTheDocument();
  });
});
