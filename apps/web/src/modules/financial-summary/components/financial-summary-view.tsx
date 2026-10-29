"use client";

import * as React from "react";
import { FinancialOverviewCards } from "./financial-overview-cards";
import { CategorySummaryBreakdown } from "./category-summary-breakdown";
import { MonthlyEvolutionChart } from "./monthly-evolution-chart";
import {
  useFinancialOverview,
  useCategorySummary,
  useMonthlyEvolution,
} from "../hooks/use-financial-summary";
import type { TransactionType } from "../types/financial-summary";

export interface FinancialSummaryViewProps {
  initialYear?: number;
}

export function FinancialSummaryView({
  initialYear = new Date().getFullYear(),
}: FinancialSummaryViewProps) {
  const [selectedYear] = React.useState<number>(initialYear);
  const [categoryType, setCategoryType] = React.useState<TransactionType>("EXPENSE");

  // Consultas aos dados
  const { data: overview, isLoading: isOverviewLoading } = useFinancialOverview();
  const { data: categorySummary, isLoading: isCategoryLoading } = useCategorySummary({
    type: categoryType,
  });
  const { data: monthlyEvolution, isLoading: isEvolutionLoading } = useMonthlyEvolution({
    year: selectedYear,
  });

  return (
    <div className="space-y-6" data-testid="financial-summary-view">
      {/* 1. Indicadores Principais / Cards de Métricas */}
      <FinancialOverviewCards
        overview={overview}
        isLoading={isOverviewLoading}
      />

      {/* 2. Seção Analítica: Distribuição por Categorias e Evolução Mensal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategorySummaryBreakdown
          summary={categorySummary}
          isLoading={isCategoryLoading}
          selectedType={categoryType}
          onTypeChange={setCategoryType}
        />

        <MonthlyEvolutionChart
          evolution={monthlyEvolution}
          isLoading={isEvolutionLoading}
        />
      </div>
    </div>
  );
}
