"use client";

import * as React from "react";
import { ArrowLeftRight, Plus } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import { Transaction } from "../types/transaction";
import { TransactionCard } from "./transaction-card";

interface TransactionsListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onOpenCreate?: () => void;
}

export function TransactionsList({
  transactions,
  isLoading = false,
  onEdit,
  onDelete,
  onOpenCreate,
}: TransactionsListProps) {
  if (isLoading) {
    return (
      <div data-testid="transactions-loading" className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-border/60 animate-pulse">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-xl bg-muted" />
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
              </div>
              <div className="h-6 w-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div
        data-testid="transactions-empty-state"
        className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-8 sm:p-12 text-center"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
          <ArrowLeftRight className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          Nenhuma transação encontrada
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1 mb-6">
          Você ainda não possui transações cadastradas ou nenhum registro coincide com os filtros aplicados.
        </p>
        {onOpenCreate && (
          <Button
            size="lg"
            onClick={onOpenCreate}
            data-testid="empty-create-transaction-button"
            className="gap-2 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Cadastrar Primeira Transação</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div data-testid="transactions-list" className="space-y-3">
      {transactions.map((tx) => (
        <TransactionCard
          key={tx.id}
          transaction={tx}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
