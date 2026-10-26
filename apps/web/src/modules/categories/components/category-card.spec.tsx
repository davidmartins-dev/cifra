import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { CategoryCard } from "./category-card";
import { CategoryType, type Category } from "../types/category";

describe("CategoryCard Component", () => {
  const mockIncomeCategory: Category = {
    id: "cat-1",
    name: "Salário Mensal",
    type: CategoryType.INCOME,
    userId: "user-1",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  const mockExpenseCategory: Category = {
    id: "cat-2",
    name: "Alimentação & Supermercado",
    type: CategoryType.EXPENSE,
    userId: "user-1",
    createdAt: "2026-01-02T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
  };

  it("deve renderizar o nome da categoria e badge de receita", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <CategoryCard
        category={mockIncomeCategory}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText("Salário Mensal")).toBeInTheDocument();
    const badge = screen.getByTestId("category-card-type-badge");
    expect(badge).toHaveTextContent("Receita");
    expect(badge).toHaveClass("text-emerald-600");
  });

  it("deve renderizar o badge de despesa formatado para categoria EXPENSE", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <CategoryCard
        category={mockExpenseCategory}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText("Alimentação & Supermercado")).toBeInTheDocument();
    const badge = screen.getByTestId("category-card-type-badge");
    expect(badge).toHaveTextContent("Despesa");
    expect(badge).toHaveClass("text-rose-600");
  });
});
