import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { TransactionCard } from "./transaction-card";
import { TransactionType, type Transaction } from "../types/transaction";

describe("TransactionCard Component", () => {
  const mockIncomeTx: Transaction = {
    id: "tx-1",
    description: "Salário Mensal",
    amount: 5000,
    type: TransactionType.INCOME,
    date: "2026-10-05T00:00:00Z",
    userId: "user-1",
    categoryId: "cat-1",
    category: {
      id: "cat-1",
      name: "Trabalho",
      type: TransactionType.INCOME,
    },
    account: {
      id: "acc-1",
      name: "Itaú",
      type: "CHECKING",
      balance: 10000,
    },
    createdAt: "2026-10-05T00:00:00Z",
    updatedAt: "2026-10-05T00:00:00Z",
  };

  const mockExpenseTx: Transaction = {
    id: "tx-2",
    description: "Supermercado",
    amount: 250.5,
    type: TransactionType.EXPENSE,
    date: "2026-10-06T00:00:00Z",
    userId: "user-1",
    categoryId: "cat-2",
    createdAt: "2026-10-06T00:00:00Z",
    updatedAt: "2026-10-06T00:00:00Z",
  };

  it("deve renderizar transação de receita com formatação correta", () => {
    render(
      <TransactionCard
        transaction={mockIncomeTx}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByTestId("transaction-card-description")).toHaveTextContent("Salário Mensal");
    expect(screen.getByTestId("transaction-card-amount")).toHaveTextContent("+ R$ 5.000,00");
    expect(screen.getByTestId("transaction-card-type-badge")).toHaveTextContent("Receita");
    expect(screen.getByText("Trabalho")).toBeInTheDocument();
    expect(screen.getByText("Itaú")).toBeInTheDocument();
  });

  it("deve renderizar transação de despesa com sinal negativo", () => {
    render(
      <TransactionCard
        transaction={mockExpenseTx}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByTestId("transaction-card-description")).toHaveTextContent("Supermercado");
    expect(screen.getByTestId("transaction-card-amount")).toHaveTextContent("- R$ 250,50");
    expect(screen.getByTestId("transaction-card-type-badge")).toHaveTextContent("Despesa");
  });
});
