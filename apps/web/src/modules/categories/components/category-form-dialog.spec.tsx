import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { CategoryFormDialog } from "./category-form-dialog";
import { CategoryType, type Category } from "../types/category";

describe("CategoryFormDialog Component", () => {
  it("deve renderizar modal de criação com campos vazios", () => {
    render(
      <CategoryFormDialog
        open={true}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText("Nova Categoria")).toBeInTheDocument();
    expect(screen.getByTestId("category-name-input")).toHaveValue("");
    expect(screen.getByText("Selecione o tipo...")).toBeInTheDocument();
    expect(screen.getByTestId("category-submit-button")).toHaveTextContent("Criar Categoria");
  });

  it("deve renderizar modal de edição preenchido com dados da categoria", () => {
    const categoryToEdit: Category = {
      id: "cat-123",
      name: "Transporte",
      type: CategoryType.EXPENSE,
      userId: "user-1",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };

    render(
      <CategoryFormDialog
        open={true}
        onOpenChange={vi.fn()}
        categoryToEdit={categoryToEdit}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText("Editar Categoria")).toBeInTheDocument();
    expect(screen.getByTestId("category-name-input")).toHaveValue("Transporte");
    expect(screen.getByText("Despesa")).toBeInTheDocument();
    expect(screen.getByTestId("category-submit-button")).toHaveTextContent("Salvar Alterações");
  });

  it("deve exibir erro de validação ao tentar submeter com nome vazio", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <CategoryFormDialog
        open={true}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />
    );

    const submitBtn = screen.getByTestId("category-submit-button");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId("category-name-error")).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
