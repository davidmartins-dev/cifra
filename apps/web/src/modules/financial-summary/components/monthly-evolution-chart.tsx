import * as React from "react";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/card";
import { maskCurrencyBRL } from "@/utils/masks";
import type { MonthlyEvolution } from "../types/financial-summary";

export interface MonthlyEvolutionChartProps {
  evolution?: MonthlyEvolution | null;
  isLoading?: boolean;
}

export function MonthlyEvolutionChart({
  evolution,
  isLoading = false,
}: MonthlyEvolutionChartProps) {
  const months = evolution?.months ?? [];
  const year = evolution?.year ?? new Date().getFullYear();
  const totalIncome = evolution?.totalIncome ?? 0;
  const totalExpense = evolution?.totalExpense ?? 0;
  const netTotal = evolution?.netTotal ?? 0;

  // Encontra o valor máximo para escala das barras
  const maxVal = Math.max(
    ...months.map((m) => Math.max(m.income, m.expense)),
    1
  );

  return (
    <Card className="border-border/60 shadow-xs" data-testid="monthly-evolution-chart">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            <span>Evolução Mensal ({year})</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Comparativo de receitas e despesas mês a mês
          </CardDescription>
        </div>

        {/* Resumo Anual */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Receitas:</span>
            <span
              className="font-semibold text-emerald-600 dark:text-emerald-400"
              data-testid="annual-total-income"
            >
              {maskCurrencyBRL(totalIncome)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span className="text-muted-foreground">Despesas:</span>
            <span
              className="font-semibold text-rose-600 dark:text-rose-400"
              data-testid="annual-total-expense"
            >
              {maskCurrencyBRL(totalExpense)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Líquido:</span>
            <span
              className={`font-semibold ${
                netTotal >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
              data-testid="annual-net-total"
            >
              {maskCurrencyBRL(netTotal)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Carregando evolução mensal...
          </div>
        ) : months.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground space-y-2"
            data-testid="monthly-evolution-empty"
          >
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Sem dados históricos para {year}
            </p>
            <p className="text-xs text-muted-foreground">
              As transações lançadas ao longo dos meses aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {months.map((m) => {
              const incomePercent = Math.min((m.income / maxVal) * 100, 100);
              const expensePercent = Math.min((m.expense / maxVal) * 100, 100);

              return (
                <div
                  key={m.month}
                  className="space-y-1.5 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                  data-testid={`month-item-${m.month}`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground w-16">
                      {m.monthName}
                    </span>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                        <TrendingUp className="h-3 w-3" />
                        {maskCurrencyBRL(m.income)}
                      </span>
                      <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-0.5">
                        <TrendingDown className="h-3 w-3" />
                        {maskCurrencyBRL(m.expense)}
                      </span>
                      <span
                        className={`w-24 text-right font-semibold ${
                          m.net >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {maskCurrencyBRL(m.net)}
                      </span>
                    </div>
                  </div>

                  {/* Barras comparativas empilhadas ou paralelas */}
                  <div className="space-y-1">
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${incomePercent}%` }}
                      />
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-rose-500 transition-all duration-300"
                        style={{ width: `${expensePercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
