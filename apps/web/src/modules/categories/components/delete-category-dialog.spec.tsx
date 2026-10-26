import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { DeleteCategoryDialog } from "./delete-category-dialog";
import { CategoryType, type Category } from "../types/category";

describe("DeleteCategoryDialog Component", () => {
  const mockCategory: Category = {
    id: "cat-123",
    name: "Alimentação",
    type: CategoryType.EXPENSE,
    userId: "user-1",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  it("não deve renderizar nada se category for null", () => {
    const { container } = render(
      <DeleteCategoryDialog
        open={true}
        onOpenChange={vi.fn()}
        category={null}
        onConfirm={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("deve renderizar modal com nome da categoria", () => {
    render(
      <DeleteCategoryDialog
        open={true}
        onOpenChange={vi.fn()}
        category={mockCategory}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText("Excluir Categoria")).toBeInTheDocument();
    expect(screen.getByText("Alimentação")).toBeInTheDocument();
    expect(screen.getByTestId("confirm-delete-category-button")).toBeInTheDocument();
    expect(screen.getByTestId("cancel-delete-category-button")).toBeInTheDocument();
  });

  it("deve chamar onConfirm ao clicar em confirmar exclusão", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();

    render(
      <DeleteCategoryDialog
        open={true}
        onOpenChange={onOpenChange}
        category={mockCategory}
        onConfirm={onConfirm}
      />
    );

    const confirmBtn = screen.getByTestId("confirm-delete-category-button");
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith("cat-123");
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
