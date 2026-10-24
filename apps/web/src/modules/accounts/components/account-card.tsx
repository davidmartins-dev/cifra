"use client";

import * as React from "react";
import {
  Banknote,
  Landmark,
  MoreVertical,
  Pencil,
  PiggyBank,
  Trash2,
  TrendingUp,
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
import { Account, AccountType } from "../types/account";
import { maskCurrencyBRL } from "@/utils/masks";

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  [AccountType.CHECKING]: "Conta Corrente",
  [AccountType.SAVINGS]: "Poupança",
  [AccountType.INVESTMENT]: "Investimentos",
  [AccountType.CASH]: "Dinheiro",
  [AccountType.OTHER]: "Outro",
};

export const ACCOUNT_TYPE_ICONS: Record<
  AccountType,
  React.ComponentType<{ className?: string }>
> = {
  [AccountType.CHECKING]: Landmark,
  [AccountType.SAVINGS]: PiggyBank,
  [AccountType.INVESTMENT]: TrendingUp,
  [AccountType.CASH]: Banknote,
  [AccountType.OTHER]: Wallet,
};

export function formatCurrency(value: number): string {
  return maskCurrencyBRL(value);
}

export function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
  const Icon = ACCOUNT_TYPE_ICONS[account.type] || Wallet;
  const typeLabel = ACCOUNT_TYPE_LABELS[account.type] || account.type;
  const isNegative = account.balance < 0;

  return (
    <Card
      data-testid="account-card"
      className="group relative overflow-hidden transition-all duration-200 hover:shadow-md border-border/60 hover:border-border"
    >
      <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
        {/* Topo do card: Ícone + Título e Menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
              <Icon className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="font-semibold text-base leading-tight tracking-tight text-foreground line-clamp-1">
                {account.name}
              </h3>
              <span className="inline-block text-xs font-medium text-muted-foreground">
                {typeLabel}
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              data-testid={`account-actions-${account.id}`}
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Opções da conta"
                />
              }
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                data-testid={`edit-account-btn-${account.id}`}
                onClick={() => onEdit(account)}
                className="cursor-pointer gap-2"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Editar</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                data-testid={`delete-account-btn-${account.id}`}
                onClick={() => onDelete(account)}
                className="cursor-pointer gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Excluir</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Rodapé do card: Saldo Atual */}
        <div className="pt-2 border-t border-border/40">
          <span className="text-xs text-muted-foreground block font-medium">
            Saldo Atual
          </span>
          <span
            data-testid="account-card-balance"
            className={`text-xl font-bold tracking-tight ${
              isNegative ? "text-rose-600 dark:text-rose-400" : "text-foreground"
            }`}
          >
            {formatCurrency(account.balance)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
