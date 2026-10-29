"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Wallet,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  PiggyBank,
  ArrowUpRight,
  ArrowLeftRight,
  Tag,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/card";
import { useAuth } from "@/modules/auth";
import {
  useFinancialOverview,
  useCategorySummary,
  useMonthlyEvolution,
  CategorySummaryBreakdown,
  MonthlyEvolutionChart,
  type TransactionType,
} from "@/modules/financial-summary";

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const { data: overview, isLoading: isOverviewLoading } = useFinancialOverview();
  const [categoryType, setCategoryType] = React.useState<TransactionType>("EXPENSE");
  const { data: categorySummary, isLoading: isCategoryLoading } = useCategorySummary({
    type: categoryType,
  });
  const { data: monthlyEvolution, isLoading: isEvolutionLoading } = useMonthlyEvolution({
    year: new Date().getFullYear(),
  });

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const formatCurrency = (value: number | undefined): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value ?? 0);
  };

  const displayName = user?.name || user?.email?.split("@")[0] || "Usuário";
  const totalMovements = (overview?.incomeCount ?? 0) + (overview?.expenseCount ?? 0);

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Cabeçalho de Boas-vindas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Olá, {displayName}!
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe o resumo da sua vida financeira e transações recentes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={isAuthLoading}
            className="cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>

      {/* Grid de Métricas / Indicadores de Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Consolidado */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Total
            </CardTitle>
            <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="dashboard-current-balance">
              {isOverviewLoading ? "Carregando..." : formatCurrency(overview?.currentBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center">
                +0% <ArrowUpRight className="h-3 w-3" />
              </span>
              em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Receitas */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receitas do Mês
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold text-emerald-600 dark:text-emerald-400"
              data-testid="dashboard-total-income"
            >
              {isOverviewLoading ? "Carregando..." : formatCurrency(overview?.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview?.incomeCount ?? 0} entrada(s) registrada(s)
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Despesas */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesas do Mês
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold text-rose-600 dark:text-rose-400"
              data-testid="dashboard-total-expense"
            >
              {isOverviewLoading ? "Carregando..." : formatCurrency(overview?.totalExpense)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview?.expenseCount ?? 0} saída(s) registrada(s)
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Economia / Saldo Líquido */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Líquido
            </CardTitle>
            <PiggyBank className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="dashboard-net-balance">
              {isOverviewLoading ? "Carregando..." : formatCurrency(overview?.netBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Resultado operacional do mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas e Bloco de Atividade */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bloco 1: Ações Rápidas */}
        <Card className="border-border/60 shadow-xs lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Ações Rápidas</CardTitle>
            <CardDescription className="text-xs">
              Atalhos para gerenciar seu patrimônio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/transactions"
              className="inline-flex items-center w-full justify-start gap-2 rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground text-sm font-medium h-10 px-3 cursor-pointer transition-colors"
            >
              <ArrowLeftRight className="h-4 w-4 text-emerald-600" />
              <span>Gerenciar Transações</span>
            </Link>
            <Link
              href="/accounts"
              className="inline-flex items-center w-full justify-start gap-2 rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground text-sm font-medium h-10 px-3 cursor-pointer transition-colors"
            >
              <Wallet className="h-4 w-4 text-sky-600" />
              <span>Gerenciar Contas</span>
            </Link>
            <Link
              href="/categories"
              className="inline-flex items-center w-full justify-start gap-2 rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground text-sm font-medium h-10 px-3 cursor-pointer transition-colors"
            >
              <Tag className="h-4 w-4 text-emerald-600" />
              <span>Gerenciar Categorias</span>
            </Link>
            <Button variant="outline" className="w-full justify-start gap-2 cursor-pointer">
              <TrendingUp className="h-4 w-4 text-violet-600" />
              <span>Ver Relatórios</span>
            </Button>
          </CardContent>
        </Card>

        {/* Bloco 2: Painel Principal / Visão de Transações */}
        <Card className="border-border/60 shadow-xs lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Atividade Recente
            </CardTitle>
            <CardDescription className="text-xs">
              Histórico das suas últimas movimentações
            </CardDescription>
          </CardHeader>
          <CardContent>
            {totalMovements > 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {totalMovements} movimentação(ões) ativa(s) registrada(s)
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Seus dados estão consolidados e sincronizados em tempo real.
                  </p>
                </div>
                <Link
                  href="/transactions"
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium h-9 px-3 cursor-pointer transition-colors"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Ver Extrato Completo</span>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground space-y-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Nenhuma transação registrada ainda
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Comece adicionando sua primeira receita ou despesa.
                  </p>
                </div>
                <Link
                  href="/transactions"
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium h-9 px-3 cursor-pointer transition-colors"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Registrar movimentação</span>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Seção Analítica: Distribuição por Categorias e Evolução Mensal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
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
    </main>
  );
}
