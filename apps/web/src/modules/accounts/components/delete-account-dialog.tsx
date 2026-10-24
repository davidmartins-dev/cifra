"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import { Button } from "@repo/ui/button";
import { Spinner } from "@repo/ui/spinner";
import { AlertTriangle } from "lucide-react";
import { Account } from "../types/account";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
  onConfirm: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function DeleteAccountDialog({
  open,
  onOpenChange,
  account,
  onConfirm,
  isLoading = false,
}: DeleteAccountDialogProps) {
  if (!account) return null;

  const handleConfirm = async () => {
    await onConfirm(account.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="delete-account-dialog"
        className="sm:max-w-105"
      >
        <DialogHeader className="gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-1">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle>Excluir Conta Financeira</DialogTitle>
          <DialogDescription>
            Tem certeza de que deseja excluir a conta{" "}
            <strong className="text-foreground">{account.name}</strong>? Esta
            ação removerá a conta e suas transações associadas serão desvinculadas.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="lg"
            data-testid="cancel-delete-account-button"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="lg"
            data-testid="confirm-delete-account-button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="cursor-pointer"
          >
            {isLoading && <Spinner className="mr-2 h-4 w-4" />}
            Confirmar Exclusão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
