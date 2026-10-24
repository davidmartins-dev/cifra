"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Plus, Wallet, ShieldCheck, CreditCard } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { toast } from "@repo/ui/toast";
import {
  useAccounts,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
} from "../hooks/use-accounts";
import { Account, AccountType } from "../types/account";
import { CreateAccountFormData } from "../schemas/account.schema";
import { AccountsList } from "./accounts-list";
import { AccountFormDialog } from "./account-form-dialog";
import { DeleteAccountDialog } from "./delete-account-dialog";
import { formatCurrency } from "./account-card";

export function AccountsView() {
  const { data: accounts = [], isLoading } = useAccounts();

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [accountToEdit, setAccountToEdit] = React.useState<Account | null>(null);
  const [accountToDelete, setAccountToDelete] = React.useState<Account | null>(null);

  // Mutations
  const createMutation = useCreateAccountMutation({
    onSuccess: (newAccount) => {
      toast.add({
        title: "Conta criada",
        description: `Conta "${newAccount.name}" criada com sucesso!`,
        type: "success",
      });
    },
    onError: (err) => {
      toast.add({
        title: "Erro ao criar conta",
        description: err.message || "Erro ao criar conta financeira.",
        type: "error",
      });
    },
  });

  const updateMutation = useUpdateAccountMutation({
    onSuccess: (updatedAccount) => {
      toast.add({
        title: "Conta atualizada",
        description: `Conta "${updatedAccount.name}" atualizada com sucesso!`,
        type: "success",
      });
    },
    onError: (err) => {
      toast.add({
        title: "Erro ao atualizar",
        description: err.message || "Erro ao atualizar conta financeira.",
        type: "error",
      });
    },
  });

  const deleteMutation = useDeleteAccountMutation({
    onSuccess: () => {
      toast.add({
        title: "Conta removida",
        description: "Conta removida com sucesso!",
        type: "success",
      });
    },
    onError: (err) => {
      toast.add({
        title: "Erro ao excluir",
        description: err.message || "Erro ao excluir conta financeira.",
        type: "error",
      });
    },
  });

  // Métricas calculadas
  const totalBalance = React.useMemo(() => {
    return accounts.reduce((acc, curr) => acc + Number(curr.balance), 0);
  }, [accounts]);

  const checkingAccountsCount = React.useMemo(() => {
    return accounts.filter((a) => a.type === AccountType.CHECKING).length;
  }, [accounts]);

  const handleOpenCreate = () => {
    setAccountToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (account: Account) => {
    setAccountToEdit(account);
    setIsFormOpen(true);
  };

  const handleDelete = (account: Account) => {
    setAccountToDelete(account);
  };

  const handleFormSubmit = async (formData: CreateAccountFormData) => {
    if (accountToEdit) {
      await updateMutation.mutateAsync({
        id: accountToEdit.id,
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
            Minhas Contas
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas contas bancárias, carteiras e acompanhe seus saldos.
          </p>
        </div>

        <div>
          <Button
            size="lg"
            onClick={handleOpenCreate}
            data-testid="open-create-account-button"
            className="cursor-pointer gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Conta</span>
          </Button>
        </div>
      </div>

      {/* Cards de Métricas Consolidada */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Saldo Consolidado */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Consolidado
            </CardTitle>
            <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div
              data-testid="total-balance-value"
              className={`text-2xl font-bold ${
                totalBalance < 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-foreground"
              }`}
            >
              {formatCurrency(totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center">
                Ativo <ArrowUpRight className="h-3 w-3" />
              </span>
              soma de todas as contas
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Total de Contas */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Contas
            </CardTitle>
            <CreditCard className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div data-testid="accounts-count-value" className="text-2xl font-bold">
              {accounts.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {checkingAccountsCount} corrente(s)
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Status de Isolamento */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Segurança
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              Protegido
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Isolamento por usuário via RBAC
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid / Lista de Contas */}
      <section className="space-y-3 pt-2">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Contas Cadastradas
        </h2>
        <AccountsList
          accounts={accounts}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onNewAccount={handleOpenCreate}
        />
      </section>

      {/* Modais de Ação */}
      <AccountFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        accountToEdit={accountToEdit}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <DeleteAccountDialog
        open={Boolean(accountToDelete)}
        onOpenChange={(open) => !open && setAccountToDelete(null)}
        account={accountToDelete}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </main>
  );
}
