"use client";

import * as React from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  MoreVertical,
  Pencil,
  Tag,
  Trash2,
  Wallet,
} from "lucide-react";
import { Card, CardContent } from "@repo/ui/card";
import { Button } from "@repo/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { Transaction, TransactionType } from "../types/transaction";
import { maskCurrencyBRL } from "@/utils/masks";

interface TransactionCardProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  [TransactionType.INCOME]: "Receita",
  [TransactionType.EXPENSE]: "Despesa",
};

export function formatTransactionDate(isoDate: string): string {
  try {
    const [year, month, day] = isoDate.split("T")[0]?.split("-") ?? [];
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
    const d = new Date(isoDate);
    return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  } catch {
    return isoDate;
  }
}

export function TransactionCard({
  transaction,
  onEdit,
  onDelete,
}: TransactionCardProps) {
  const isIncome = transaction.type === TransactionType.INCOME;
  const TypeIcon = isIncome ? ArrowDownLeft : ArrowUpRight;
  const formattedAmount = `${isIncome ? "+" : "-"} ${maskCurrencyBRL(
    transaction.amount
  )}`;
  const formattedDate = formatTransactionDate(transaction.date);

  return (
    <Card
      data-testid="transaction-card"
      className="group relative overflow-hidden transition-all duration-200 hover:shadow-md border-border/60 hover:border-border"
    >
      <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
        {/* Lado Esquerdo: Ícone + Detalhes */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${
              isIncome
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            }`}
          >
            <TypeIcon className="h-5 w-5" />
          </div>

          <div className="min-w-0 space-y-1">
            <h3
              data-testid="transaction-card-description"
              className="font-semibold text-base leading-tight tracking-tight text-foreground truncate"
            >
              {transaction.description}
            </h3>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{formattedDate}</span>

              {transaction.category && (
                <>
                  <span className="text-border">•</span>
                  <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    {transaction.category.name}
                  </span>
                </>
              )}

              {transaction.account && (
                <>
                  <span className="text-border">•</span>
                  <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                    <Wallet className="h-3 w-3 text-muted-foreground" />
                    {transaction.account.name}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Lado Direito: Valor + Menu de Ações */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span
              data-testid="transaction-card-amount"
              className={`text-base font-bold tracking-tight ${
                isIncome
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {formattedAmount}
            </span>
            <div className="text-[11px] font-medium text-muted-foreground">
              <span data-testid="transaction-card-type-badge">
                {TRANSACTION_TYPE_LABELS[transaction.type]}
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              data-testid={`transaction-actions-${transaction.id}`}
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Opções da transação"
                />
              }
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                data-testid={`edit-transaction-btn-${transaction.id}`}
                onClick={() => onEdit(transaction)}
                className="cursor-pointer gap-2"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Editar</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                data-testid={`delete-transaction-btn-${transaction.id}`}
                onClick={() => onDelete(transaction)}
                className="cursor-pointer gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Excluir</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
