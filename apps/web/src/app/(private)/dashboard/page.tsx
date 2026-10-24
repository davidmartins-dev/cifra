"use client";

import { useRouter } from "next/navigation";
import {
  LogOut,
  Wallet,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  PiggyBank,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/card";
import { useAuth } from "@/modules/auth";

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const displayName = user?.name || user?.email?.split("@")[0] || "Usuário";

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
            disabled={isLoading}
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
            <div className="text-2xl font-bold">R$ 0,00</div>
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
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              R$ 0,00
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Entradas registradas
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
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              R$ 0,00
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Saídas e pagamentos
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Economia / Meta */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Economia Estimada
            </CardTitle>
            <PiggyBank className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0,00</div>
            <p className="text-xs text-muted-foreground mt-1">
              Meta financeira ativa
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
            <Button variant="outline" className="w-full justify-start gap-2 cursor-pointer">
              <PlusCircle className="h-4 w-4 text-emerald-600" />
              <span>Nova Transação</span>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 cursor-pointer">
              <Wallet className="h-4 w-4 text-sky-600" />
              <span>Gerenciar Contas</span>
            </Button>
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
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer">
                <PlusCircle className="h-4 w-4" />
                Registrar movimentação
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
