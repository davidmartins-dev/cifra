import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { FinancialOverviewCards } from "./financial-overview-cards";
import type { FinancialOverview } from "../types/financial-summary";

describe("FinancialOverviewCards Component", () => {
  const mockOverview: FinancialOverview = {
    currentBalance: 12500.5,
    totalIncome: 15000,
    totalExpense: 2499.5,
    netBalance: 12500.5,
    incomeCount: 3,
    expenseCount: 5,
  };

  it("deve renderizar os 4 cards com valores monetários formatados", () => {
    render(<FinancialOverviewCards overview={mockOverview} />);

    expect(screen.getByTestId("financial-overview-balance")).toHaveTextContent("12.500,50");
    expect(screen.getByTestId("financial-overview-income")).toHaveTextContent("15.000,00");
    expect(screen.getByTestId("financial-overview-expense")).toHaveTextContent("2.499,50");
    expect(screen.getByTestId("financial-overview-net")).toHaveTextContent("12.500,50");
  });

  it("deve exibir quantidade de movimentações de receitas e despesas", () => {
    render(<FinancialOverviewCards overview={mockOverview} />);

    expect(screen.getByText(/3 entrada\(s\) registrada\(s\)/)).toBeInTheDocument();
    expect(screen.getByText(/5 saída\(s\) registrada\(s\)/)).toBeInTheDocument();
  });

  it("deve exibir estado de carregamento quando isLoading for true", () => {
    render(<FinancialOverviewCards isLoading={true} />);

    const loadingTexts = screen.getAllByText("Carregando...");
    expect(loadingTexts.length).toBe(4);
  });

  it("deve destacar déficit quando saldo líquido for negativo", () => {
    const deficitOverview: FinancialOverview = {
      ...mockOverview,
      netBalance: -1500,
    };

    render(<FinancialOverviewCards overview={deficitOverview} />);

    const netElement = screen.getByTestId("financial-overview-net");
    expect(netElement).toHaveTextContent("-R$ 1.500,00");
    expect(netElement).toHaveClass("text-rose-600");
    expect(screen.getByText(/Déficit/)).toBeInTheDocument();
  });
});
