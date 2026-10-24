"use client";

import * as React from "react";
import { PlusCircle, Wallet } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import { Account } from "../types/account";
import { AccountCard } from "./account-card";

interface AccountsListProps {
  accounts?: Account[];
  isLoading: boolean;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
  onNewAccount: () => void;
}

export function AccountsList({
  accounts = [],
  isLoading,
  onEdit,
  onDelete,
  onNewAccount,
}: AccountsListProps) {
  if (isLoading) {
    return (
      <div
        data-testid="accounts-loading-skeleton"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {[1, 2, 3].map((index) => (
          <Card key={index} className="border-border/60 animate-pulse">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted" />
                  <div className="space-y-2">
                    <div className="h-4 w-28 bg-muted rounded" />
                    <div className="h-3 w-16 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-8 w-8 bg-muted rounded-md" />
              </div>
              <div className="pt-2 border-t border-border/40 space-y-1">
                <div className="h-3 w-16 bg-muted rounded" />
                <div className="h-6 w-32 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card
        data-testid="accounts-empty-state"
        className="border-dashed border-2 border-border/70 p-8 text-center"
      >
        <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Wallet className="h-6 w-6" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="font-semibold text-lg text-foreground">
              Nenhuma conta cadastrada
            </h3>
            <p className="text-sm text-muted-foreground">
              Cadastre suas contas bancárias, poupança, investimentos ou carteiras
              para acompanhar seu saldo consolidado.
            </p>
          </div>
          <Button
            size="lg"
            onClick={onNewAccount}
            data-testid="empty-create-account-button"
            className="cursor-pointer gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Cadastrar primeira conta</span>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      data-testid="accounts-grid"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {accounts.map((account) => (
        <AccountCard
          key={account.id}
          account={account}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
