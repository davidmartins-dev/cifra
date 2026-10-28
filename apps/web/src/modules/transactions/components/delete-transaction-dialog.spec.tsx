import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { DeleteTransactionDialog } from "./delete-transaction-dialog";
import { TransactionType, type Transaction } from "../types/transaction";

describe("DeleteTransactionDialog Component", () => {
  const mockTransaction: Transaction = {
    id: "tx-123",
    description: "Aluguel",
    amount: 1500,
    type: TransactionType.EXPENSE,
    date: "2026-10-01T00:00:00Z",
    userId: "user-1",
    categoryId: "cat-1",
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
  };

  it("não deve renderizar nada se transaction for null", () => {
    const { container } = render(
      <DeleteTransactionDialog
        open={true}
        onOpenChange={vi.fn()}
        transaction={null}
        onConfirm={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("deve renderizar modal com descrição da transação", () => {
    render(
      <DeleteTransactionDialog
        open={true}
        onOpenChange={vi.fn()}
        transaction={mockTransaction}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText("Excluir Transação")).toBeInTheDocument();
    expect(screen.getByText("Aluguel")).toBeInTheDocument();
    expect(screen.getByTestId("confirm-delete-transaction-button")).toBeInTheDocument();
    expect(screen.getByTestId("cancel-delete-transaction-button")).toBeInTheDocument();
  });

  it("deve chamar onConfirm ao confirmar exclusão", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();

    render(
      <DeleteTransactionDialog
        open={true}
        onOpenChange={onOpenChange}
        transaction={mockTransaction}
        onConfirm={onConfirm}
      />
    );

    const confirmBtn = screen.getByTestId("confirm-delete-transaction-button");
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith("tx-123");
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
