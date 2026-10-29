import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { CategorySummaryBreakdown } from "./category-summary-breakdown";
import type { CategorySummary } from "../types/financial-summary";

describe("CategorySummaryBreakdown Component", () => {
  const mockSummary: CategorySummary = {
    type: "EXPENSE",
    totalAmount: 1000,
    categories: [
      {
        categoryId: "cat-1",
        categoryName: "Alimentação",
        amount: 600,
        percentage: 60,
        count: 4,
      },
      {
        categoryId: "cat-2",
        categoryName: "Transporte",
        amount: 400,
        percentage: 40,
        count: 2,
      },
    ],
  };

  it("deve renderizar a lista de categorias com valores, percentuais e contagem", () => {
    const onTypeChange = vi.fn();

    render(
      <CategorySummaryBreakdown
        summary={mockSummary}
        selectedType="EXPENSE"
        onTypeChange={onTypeChange}
      />
    );

    expect(screen.getByText("Alimentação")).toBeInTheDocument();
    expect(screen.getByText("Transporte")).toBeInTheDocument();
    expect(screen.getByText("60.0%")).toBeInTheDocument();
    expect(screen.getByText("40.0%")).toBeInTheDocument();
    expect(screen.getByText("R$ 1.000,00")).toBeInTheDocument();
  });

  it("deve chamar onTypeChange ao clicar nos botões de filtro", () => {
    const onTypeChange = vi.fn();

    render(
      <CategorySummaryBreakdown
        summary={mockSummary}
        selectedType="EXPENSE"
        onTypeChange={onTypeChange}
      />
    );

    fireEvent.click(screen.getByTestId("filter-income-type"));
    expect(onTypeChange).toHaveBeenCalledWith("INCOME");
  });

  it("deve exibir estado vazio quando não houver categorias no período", () => {
    render(
      <CategorySummaryBreakdown
        summary={{ type: "EXPENSE", totalAmount: 0, categories: [] }}
        selectedType="EXPENSE"
        onTypeChange={vi.fn()}
      />
    );

    expect(screen.getByTestId("category-summary-empty")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma movimentação encontrada")).toBeInTheDocument();
  });

  it("deve exibir carregamento quando isLoading for true", () => {
    render(
      <CategorySummaryBreakdown
        isLoading={true}
        selectedType="EXPENSE"
        onTypeChange={vi.fn()}
      />
    );

    expect(screen.getByText("Carregando categorias...")).toBeInTheDocument();
  });
});
