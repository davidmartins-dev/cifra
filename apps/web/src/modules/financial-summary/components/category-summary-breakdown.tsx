import * as React from "react";
import { Tag, PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/card";
import { Button } from "@repo/ui/button";
import { maskCurrencyBRL } from "@/utils/masks";
import type { CategorySummary, TransactionType } from "../types/financial-summary";

export interface CategorySummaryBreakdownProps {
  summary?: CategorySummary | null;
  isLoading?: boolean;
  selectedType: TransactionType;
  onTypeChange: (type: TransactionType) => void;
}

export function CategorySummaryBreakdown({
  summary,
  isLoading = false,
  selectedType,
  onTypeChange,
}: CategorySummaryBreakdownProps) {
  const categories = summary?.categories ?? [];
  const totalAmount = summary?.totalAmount ?? 0;

  return (
    <Card className="border-border/60 shadow-xs" data-testid="category-summary-breakdown">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <PieChart className="h-4 w-4 text-emerald-600" />
            <span>Distribuição por Categorias</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Proporção de {selectedType === "EXPENSE" ? "despesas" : "receitas"} no período
          </CardDescription>
        </div>

        {/* Toggle Despesas / Receitas */}
        <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
          <Button
            type="button"
            variant={selectedType === "EXPENSE" ? "default" : "ghost"}
            size="sm"
            onClick={() => onTypeChange("EXPENSE")}
            className="h-7 text-xs px-2.5 rounded-md cursor-pointer"
            data-testid="filter-expense-type"
          >
            Despesas
          </Button>
          <Button
            type="button"
            variant={selectedType === "INCOME" ? "default" : "ghost"}
            size="sm"
            onClick={() => onTypeChange("INCOME")}
            className="h-7 text-xs px-2.5 rounded-md cursor-pointer"
            data-testid="filter-income-type"
          >
            Receitas
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Carregando categorias...
          </div>
        ) : categories.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground space-y-2"
            data-testid="category-summary-empty"
          >
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <Tag className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Nenhuma movimentação encontrada
            </p>
            <p className="text-xs text-muted-foreground">
              Não há dados de {selectedType === "EXPENSE" ? "despesas" : "receitas"} para este filtro.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-xs text-muted-foreground flex justify-between items-center pb-1 border-b border-border/40">
              <span>Total acumulado</span>
              <span className="font-semibold text-foreground">
                {maskCurrencyBRL(totalAmount)}
              </span>
            </div>

            <div className="space-y-3">
              {categories.map((cat) => (
                <div
                  key={cat.categoryId}
                  className="space-y-1.5"
                  data-testid={`category-item-${cat.categoryId}`}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                      {cat.categoryName}
                      <span className="text-xs text-muted-foreground font-normal">
                        ({cat.count})
                      </span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {maskCurrencyBRL(cat.amount)}
                      </span>
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {cat.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Barra de progresso percentual */}
                  <div
                    className="h-2 w-full rounded-full bg-muted overflow-hidden"
                    role="progressbar"
                    aria-valuenow={cat.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${cat.categoryName}: ${cat.percentage.toFixed(1)}%`}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        selectedType === "EXPENSE" ? "bg-rose-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(Math.max(cat.percentage, 0), 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
