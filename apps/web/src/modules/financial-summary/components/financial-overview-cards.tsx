import * as React from "react";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { maskCurrencyBRL } from "@/utils/masks";
import type { FinancialOverview } from "../types/financial-summary";

export interface FinancialOverviewCardsProps {
  overview?: FinancialOverview | null;
  isLoading?: boolean;
}

export function FinancialOverviewCards({
  overview,
  isLoading = false,
}: FinancialOverviewCardsProps) {
  const currentBalance = overview?.currentBalance ?? 0;
  const totalIncome = overview?.totalIncome ?? 0;
  const totalExpense = overview?.totalExpense ?? 0;
  const netBalance = overview?.netBalance ?? 0;

  const isNetPositive = netBalance >= 0;

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      data-testid="financial-overview-cards"
    >
      {/* 1. Saldo Total Consolidado */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Saldo Total
          </CardTitle>
          <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Wallet className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="text-2xl font-bold tracking-tight"
            data-testid="financial-overview-balance"
          >
            {isLoading ? "Carregando..." : maskCurrencyBRL(currentBalance)}
          </div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center">
              Consolidado
            </span>
            todas as contas ativas
          </p>
        </CardContent>
      </Card>

      {/* 2. Total de Receitas */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Receitas do Mês
          </CardTitle>
          <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight"
            data-testid="financial-overview-income"
          >
            {isLoading ? "Carregando..." : maskCurrencyBRL(totalIncome)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {overview?.incomeCount ?? 0} entrada(s) registrada(s)
          </p>
        </CardContent>
      </Card>

      {/* 3. Total de Despesas */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Despesas do Mês
          </CardTitle>
          <div className="h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <TrendingDown className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="text-2xl font-bold text-rose-600 dark:text-rose-400 tracking-tight"
            data-testid="financial-overview-expense"
          >
            {isLoading ? "Carregando..." : maskCurrencyBRL(totalExpense)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {overview?.expenseCount ?? 0} saída(s) registrada(s)
          </p>
        </CardContent>
      </Card>

      {/* 4. Saldo Líquido Operacional */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Resultado Líquido
          </CardTitle>
          <div className="h-8 w-8 rounded-full bg-sky-100 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <PiggyBank className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold tracking-tight ${
              isNetPositive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
            data-testid="financial-overview-net"
          >
            {isLoading ? "Carregando..." : maskCurrencyBRL(netBalance)}
          </div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            {isNetPositive ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center">
                Superávit <ArrowUpRight className="h-3 w-3" />
              </span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 font-medium inline-flex items-center">
                Déficit <ArrowDownRight className="h-3 w-3" />
              </span>
            )}
            no período selecionado
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
