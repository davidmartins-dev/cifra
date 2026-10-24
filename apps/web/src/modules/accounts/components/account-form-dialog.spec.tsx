import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { AccountFormDialog } from "./account-form-dialog";
import { AccountType, type Account } from "../types/account";
import { formatCurrency } from "./account-card";

describe("AccountFormDialog Component", () => {
  it("deve renderizar modal de criação com campos vazios e defaults", () => {
    render(
      <AccountFormDialog
        open={true}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText("Nova Conta Financeira")).toBeInTheDocument();
    expect(screen.getByTestId("account-name-input")).toHaveValue("");
    expect(screen.getByText("Selecione...")).toBeInTheDocument();
    expect(screen.getByTestId("account-balance-input")).toHaveValue(formatCurrency(0));
    expect(screen.getByTestId("account-submit-button")).toHaveTextContent("Criar Conta");
  });

  it("deve renderizar modal de edição preenchido com dados da conta", () => {
    const accountToEdit: Account = {
      id: "acc-123",
      name: "Itaú Investimentos",
      type: AccountType.INVESTMENT,
      balance: 10500,
      userId: "user-1",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };

    render(
      <AccountFormDialog
        open={true}
        onOpenChange={vi.fn()}
        accountToEdit={accountToEdit}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText("Editar Conta Financeira")).toBeInTheDocument();
    expect(screen.getByTestId("account-name-input")).toHaveValue("Itaú Investimentos");
    expect(screen.getByText("Investimentos")).toBeInTheDocument();
    expect(screen.getByTestId("account-balance-input")).toHaveValue(formatCurrency(10500));
    expect(screen.getByTestId("account-submit-button")).toHaveTextContent("Salvar Alterações");
  });

  it("deve exibir erro de validação ao tentar submeter com nome vazio", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <AccountFormDialog
        open={true}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />
    );

    const submitBtn = screen.getByTestId("account-submit-button");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId("account-name-error")).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("deve chamar onSubmit com dados preenchidos corretamente", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();

    render(
      <AccountFormDialog
        open={true}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />
    );

    const nameInput = screen.getByTestId("account-name-input");
    const balanceInput = screen.getByTestId("account-balance-input");

    await user.type(nameInput, "Banco Inter");
    await user.clear(balanceInput);
    await user.type(balanceInput, "150000");

    const submitBtn = screen.getByTestId("account-submit-button");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: "Banco Inter",
        type: AccountType.CHECKING,
        balance: 1500,
      });
    });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
