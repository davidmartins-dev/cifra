"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Plus,
  Scale,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { toast } from "@repo/ui/toast";
import {
  useTransactions,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
} from "../hooks/use-transactions";
import { Transaction, TransactionType } from "../types/transaction";
import { CreateTransactionFormData } from "../schemas/transaction.schema";
import { TransactionsList } from "./transactions-list";
import {
  TransactionsFilters,
  type TransactionFilterValues,
} from "./transactions-filters";
import { TransactionFormDialog } from "./transaction-form-dialog";
import { DeleteTransactionDialog } from "./delete-transaction-dialog";
import { maskCurrencyBRL } from "@/utils/masks";

export function TransactionsView() {
  const [filters, setFilters] = React.useState<TransactionFilterValues>({
    search: "",
    type: "ALL",
    categoryId: "",
    accountId: "",
    startDate: "",
    endDate: "",
  });

  const { data: allTransactions = [], isLoading } = useTransactions();

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [transactionToEdit, setTransactionToEdit] =
    React.useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] =
    React.useState<Transaction | null>(null);

  // Mutations
  const createMutation = useCreateTransactionMutation({
    onSuccess: (newTx) => {
      toast.add({
        title: "Transação criada",
        description: `Transação "${newTx.description}" criada com sucesso!`,
        type: "success",
      });
    },
    onError: (err) => {
      toast.add({
        title: "Erro ao criar transação",
        description: err.message || "Erro ao registrar transação financeira.",
        type: "error",
      });
    },
  });

  const updateMutation = useUpdateTransactionMutation({
    onSuccess: (updatedTx) => {
      toast.add({
        title: "Transação atualizada",
        description: `Transação "${updatedTx.description}" atualizada com sucesso!`,
        type: "success",
      });
    },
    onError: (err) => {
      toast.add({
        title: "Erro ao atualizar",
        description: err.message || "Erro ao atualizar transação financeira.",
        type: "error",
      });
    },
  });

  const deleteMutation = useDeleteTransactionMutation({
    onSuccess: () => {
      toast.add({
        title: "Transação removida",
        description: "Transação removida com sucesso!",
        type: "success",
      });
    },
    onError: (err) => {
      toast.add({
        title: "Erro ao excluir",
        description: err.message || "Erro ao excluir transação financeira.",
        type: "error",
      });
    },
  });

  // Métricas consolidadas
  const incomeTransactions = React.useMemo(() => {
    return allTransactions.filter((t) => t.type === TransactionType.INCOME);
  }, [allTransactions]);

  const expenseTransactions = React.useMemo(() => {
    return allTransactions.filter((t) => t.type === TransactionType.EXPENSE);
  }, [allTransactions]);

  const totalIncome = React.useMemo(() => {
    return incomeTransactions.reduce((acc, t) => acc + t.amount, 0);
  }, [incomeTransactions]);

  const totalExpense = React.useMemo(() => {
    return expenseTransactions.reduce((acc, t) => acc + t.amount, 0);
  }, [expenseTransactions]);

  const netBalance = totalIncome - totalExpense;

  // Filtragem local
  const filteredTransactions = React.useMemo(() => {
    return allTransactions.filter((tx) => {
      if (filters.type !== "ALL" && tx.type !== filters.type) return false;
      if (filters.categoryId && tx.categoryId !== filters.categoryId)
        return false;
      if (filters.accountId && tx.accountId !== filters.accountId) return false;
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesDesc = tx.description.toLowerCase().includes(query);
        const matchesCategory = tx.category?.name?.toLowerCase().includes(query);
        if (!matchesDesc && !matchesCategory) return false;
      }
      if (filters.startDate) {
        const txDate = tx.date.split("T")[0] || tx.date;
        if (txDate < filters.startDate) return false;
      }
      if (filters.endDate) {
        const txDate = tx.date.split("T")[0] || tx.date;
        if (txDate > filters.endDate) return false;
      }
      return true;
    });
  }, [allTransactions, filters]);

  const handleOpenCreate = () => {
    setTransactionToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setIsFormOpen(true);
  };

  const handleDelete = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
  };

  const handleFormSubmit = async (formData: CreateTransactionFormData) => {
    if (transactionToEdit) {
      await updateMutation.mutateAsync({
        id: transactionToEdit.id,
        data: formData,
      });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  const handleConfirmDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Topo / Breadcrumb & Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Voltar ao Dashboard
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Minhas Transações
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie todas as suas receitas e despesas com visão detalhada do seu fluxo financeiro.
          </p>
        </div>

        <div>
          <Button
            size="lg"
            onClick={handleOpenCreate}
            data-testid="open-create-transaction-button"
            className="cursor-pointer gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Transação</span>
          </Button>
        </div>
      </div>

      {/* Cards de Métricas Consolidadas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Receitas */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Receitas
            </CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div
              data-testid="total-income-amount"
              className="text-2xl font-bold text-emerald-600 dark:text-emerald-400"
            >
              {maskCurrencyBRL(totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {incomeTransactions.length} entrada(s) registradas
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Total Despesas */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Despesas
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div
              data-testid="total-expense-amount"
              className="text-2xl font-bold text-rose-600 dark:text-rose-400"
            >
              {maskCurrencyBRL(totalExpense)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {expenseTransactions.length} saída(s) registradas
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Saldo Líquido */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo do Período
            </CardTitle>
            <Scale
              className={`h-4 w-4 ${
                netBalance >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-500"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div
              data-testid="net-balance-amount"
              className={`text-2xl font-bold ${
                netBalance >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {maskCurrencyBRL(netBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {allTransactions.length} movimentação(ões) no total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Filtros e Listagem */}
      <section className="space-y-4 pt-2">
        <TransactionsFilters
          filters={filters}
          onChange={setFilters}
          counts={{
            all: allTransactions.length,
            income: incomeTransactions.length,
            expense: expenseTransactions.length,
          }}
        />

        <TransactionsList
          transactions={filteredTransactions}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onOpenCreate={handleOpenCreate}
        />
      </section>

      {/* Modais */}
      <TransactionFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        transactionToEdit={transactionToEdit}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <DeleteTransactionDialog
        open={Boolean(transactionToDelete)}
        onOpenChange={(open) => {
          if (!open) setTransactionToDelete(null);
        }}
        transaction={transactionToDelete}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </main>
  );
}
