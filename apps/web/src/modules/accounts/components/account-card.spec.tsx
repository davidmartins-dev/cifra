import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { AccountCard, formatCurrency } from "./account-card";
import { AccountType, type Account } from "../types/account";

describe("AccountCard Component", () => {
  const mockAccount: Account = {
    id: "acc-1",
    name: "Banco Nubank",
    type: AccountType.CHECKING,
    balance: 1450.75,
    userId: "user-1",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  it("deve formatar valores monetários corretamente em BRL", () => {
    const formatted = formatCurrency(1450.75);
    expect(formatted).toContain("1.450,75");
    expect(formatted).toContain("R$");
  });

  it("deve renderizar o nome da conta, tipo e saldo", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <AccountCard
        account={mockAccount}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText("Banco Nubank")).toBeInTheDocument();
    expect(screen.getByText("Conta Corrente")).toBeInTheDocument();
    expect(screen.getByTestId("account-card-balance")).toHaveTextContent("1.450,75");
  });

  it("deve estilizar saldo negativo de forma destacada", () => {
    const negativeAccount: Account = {
      ...mockAccount,
      balance: -250.5,
    };

    render(
      <AccountCard
        account={negativeAccount}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const balanceElement = screen.getByTestId("account-card-balance");
    expect(balanceElement).toHaveTextContent("250,50");
    expect(balanceElement).toHaveClass("text-rose-600");
  });
});
