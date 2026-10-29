import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { MonthlyEvolutionChart } from "./monthly-evolution-chart";
import type { MonthlyEvolution } from "../types/financial-summary";

describe("MonthlyEvolutionChart Component", () => {
  const mockEvolution: MonthlyEvolution = {
    year: 2026,
    totalIncome: 12000,
    totalExpense: 8000,
    netTotal: 4000,
    months: [
      {
        month: 1,
        monthName: "Jan",
        income: 6000,
        expense: 4000,
        net: 2000,
      },
      {
        month: 2,
        monthName: "Fev",
        income: 6000,
        expense: 4000,
        net: 2000,
      },
    ],
  };

  it("deve renderizar totais anuais de receitas, despesas e líquido", () => {
    render(<MonthlyEvolutionChart evolution={mockEvolution} />);

    expect(screen.getByText("Evolução Mensal (2026)")).toBeInTheDocument();
    expect(screen.getByTestId("annual-total-income")).toHaveTextContent("12.000,00");
    expect(screen.getByTestId("annual-total-expense")).toHaveTextContent("8.000,00");
    expect(screen.getByTestId("annual-net-total")).toHaveTextContent("4.000,00");
  });

  it("deve renderizar cada mês com seus respectivos valores", () => {
    render(<MonthlyEvolutionChart evolution={mockEvolution} />);

    expect(screen.getByTestId("month-item-1")).toBeInTheDocument();
    expect(screen.getByTestId("month-item-2")).toBeInTheDocument();
    expect(screen.getByText("Jan")).toBeInTheDocument();
    expect(screen.getByText("Fev")).toBeInTheDocument();
  });

  it("deve exibir estado vazio quando a lista de meses estiver vazia", () => {
    render(
      <MonthlyEvolutionChart
        evolution={{
          year: 2026,
          totalIncome: 0,
          totalExpense: 0,
          netTotal: 0,
          months: [],
        }}
      />
    );

    expect(screen.getByTestId("monthly-evolution-empty")).toBeInTheDocument();
    expect(screen.getByText("Sem dados históricos para 2026")).toBeInTheDocument();
  });

  it("deve exibir estado de carregamento quando isLoading for true", () => {
    render(<MonthlyEvolutionChart isLoading={true} />);

    expect(screen.getByText("Carregando evolução mensal...")).toBeInTheDocument();
  });
});
