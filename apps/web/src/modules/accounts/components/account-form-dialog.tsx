"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Spinner } from "@repo/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import {
  createAccountSchema,
  CreateAccountInput,
  CreateAccountFormData,
} from "../schemas/account.schema";
import { Account, AccountType } from "../types/account";
import { ACCOUNT_TYPE_LABELS } from "./account-card";
import { maskCurrencyBRL, parseCurrencyBRL } from "@/utils/masks";

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountToEdit?: Account | null;
  onSubmit: (data: CreateAccountFormData) => Promise<void>;
  isLoading?: boolean;
}

export function AccountFormDialog({
  open,
  onOpenChange,
  accountToEdit,
  onSubmit,
  isLoading = false,
}: AccountFormDialogProps) {
  const isEditing = Boolean(accountToEdit);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateAccountInput, undefined, CreateAccountFormData>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      name: "",
      type: undefined,
      balance: 0,
    },
  });

  // Reseta os valores quando abre/fecha ou altera a conta para edição
  React.useEffect(() => {
    if (open) {
      if (accountToEdit) {
        reset({
          name: accountToEdit.name,
          type: accountToEdit.type,
          balance: accountToEdit.balance,
        });
      } else {
        reset({
          name: "",
          type: undefined,
          balance: 0,
        });
      }
    }
  }, [open, accountToEdit, reset]);

  const handleFormSubmit = async (data: CreateAccountFormData) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="account-form-dialog"
        className="sm:max-w-110"
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Conta Financeira" : "Nova Conta Financeira"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações da sua conta cadastrada."
              : "Cadastre uma nova conta para gerenciar receitas e despesas."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
          {/* Nome da Conta */}
          <div className="space-y-2">
            <Label htmlFor="account-name">Nome da Conta</Label>
            <Input
              id="account-name"
              data-testid="account-name-input"
              placeholder="Ex.: Nubank, Carteira, XP Investimentos"
              disabled={isLoading}
              {...register("name")}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && (
              <p
                data-testid="account-name-error"
                className="text-xs font-medium text-destructive"
              >
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Tipo da Conta */}
          <div className="space-y-2">
            <Label htmlFor="account-type">Tipo de Conta</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select
                  items={ACCOUNT_TYPE_LABELS}
                  itemToStringLabel={(val) =>
                    val ? ACCOUNT_TYPE_LABELS[val as AccountType] ?? String(val) : ""
                  }
                  value={field.value ?? null}
                  onValueChange={(val) => field.onChange(val)}
                  disabled={isLoading}
                >
                  <SelectTrigger
                    id="account-type"
                    data-testid="account-type-select"
                    className="w-full"
                  >
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(AccountType).map((type) => (
                      <SelectItem
                        key={type}
                        value={type}
                        label={ACCOUNT_TYPE_LABELS[type]}
                        data-testid={`account-type-option-${type}`}
                      >
                        {ACCOUNT_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && (
              <p className="text-xs font-medium text-destructive">
                {errors.type.message}
              </p>
            )}
          </div>

          {/* Saldo Inicial / Atual */}
          <div className="space-y-2">
            <Label htmlFor="account-balance">
              {isEditing ? "Saldo Atual" : "Saldo Inicial"}
            </Label>
            <Controller
              name="balance"
              control={control}
              render={({ field }) => (
                <Input
                  id="account-balance"
                  data-testid="account-balance-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="R$ 0,00"
                  disabled={isLoading}
                  value={maskCurrencyBRL(field.value)}
                  onChange={(e) => field.onChange(parseCurrencyBRL(e.target.value))}
                  aria-invalid={Boolean(errors.balance)}
                />
              )}
            />
            {errors.balance && (
              <p
                data-testid="account-balance-error"
                className="text-xs font-medium text-destructive"
              >
                {errors.balance.message}
              </p>
            )}
          </div>

          <DialogFooter className="mt-6 pt-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              data-testid="account-cancel-button"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="lg"
              data-testid="account-submit-button"
              disabled={isLoading}
              className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              {isEditing ? "Salvar Alterações" : "Criar Conta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
