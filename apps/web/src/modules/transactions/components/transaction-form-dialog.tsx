"use client";

import * as React from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
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
  createTransactionSchema,
  CreateTransactionInput,
  CreateTransactionFormData,
} from "../schemas/transaction.schema";
import { Transaction, TransactionType } from "../types/transaction";
import { useCategories } from "@/modules/categories/hooks/use-categories";
import { useAccounts } from "@/modules/accounts/hooks/use-accounts";
import { maskCurrencyBRL, parseCurrencyBRL } from "@/utils/masks";

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionToEdit?: Transaction | null;
  onSubmit: (data: CreateTransactionFormData) => Promise<void>;
  isLoading?: boolean;
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  transactionToEdit,
  onSubmit,
  isLoading = false,
}: TransactionFormDialogProps) {
  const isEditing = Boolean(transactionToEdit);

  const { data: allCategories = [] } = useCategories();
  const { data: allAccounts = [] } = useAccounts();

  const getTodayDate = () => new Date().toISOString().split("T")[0]!;

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateTransactionInput, undefined, CreateTransactionFormData>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      type: TransactionType.EXPENSE,
      description: "",
      amount: 0,
      date: getTodayDate(),
      categoryId: "",
      accountId: null,
      notes: null,
    },
  });

  const selectedType = useWatch({ control, name: "type" }) ?? TransactionType.EXPENSE;

  // Filtra as categorias compatíveis com o tipo selecionado (Receita ou Despesa)
  const availableCategories = React.useMemo(() => {
    return allCategories.filter((c) => c.type === selectedType);
  }, [allCategories, selectedType]);

  React.useEffect(() => {
    if (open) {
      if (transactionToEdit) {
        reset({
          type: transactionToEdit.type,
          description: transactionToEdit.description,
          amount: transactionToEdit.amount,
          date: transactionToEdit.date.split("T")[0] || getTodayDate(),
          categoryId: transactionToEdit.categoryId,
          accountId: transactionToEdit.accountId ?? null,
          notes: transactionToEdit.notes ?? null,
        });
      } else {
        reset({
          type: TransactionType.EXPENSE,
          description: "",
          amount: 0,
          date: getTodayDate(),
          categoryId: "",
          accountId: null,
          notes: null,
        });
      }
    }
  }, [open, transactionToEdit, reset]);

  const handleFormSubmit = async (data: CreateTransactionFormData) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  const handleTypeSelect = (type: TransactionType) => {
    setValue("type", type);
    // Limpa categoria caso ela não seja compatível com o novo tipo
    const currentCatId = getValues("categoryId");
    const isCurrentCatCompatible = allCategories.some(
      (c) => c.id === currentCatId && c.type === type
    );
    if (!isCurrentCatCompatible) {
      setValue("categoryId", "");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="transaction-form-dialog"
        className="sm:max-w-120 max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Transação" : "Nova Transação"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações da sua transação financeira."
              : "Cadastre uma nova movimentação para manter seu fluxo sob controle."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
          {/* Tipo de Transação: Receita ou Despesa */}
          <div className="space-y-1.5">
            <Label>Tipo de Movimentação</Label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-lg border border-border">
              <button
                type="button"
                data-testid="transaction-type-expense-btn"
                onClick={() => handleTypeSelect(TransactionType.EXPENSE)}
                className={`py-2 px-3 text-xs sm:text-sm font-semibold rounded-md transition-all cursor-pointer ${
                  selectedType === TransactionType.EXPENSE
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Despesa (-)
              </button>
              <button
                type="button"
                data-testid="transaction-type-income-btn"
                onClick={() => handleTypeSelect(TransactionType.INCOME)}
                className={`py-2 px-3 text-xs sm:text-sm font-semibold rounded-md transition-all cursor-pointer ${
                  selectedType === TransactionType.INCOME
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Receita (+)
              </button>
            </div>
            {errors.type && (
              <p
                data-testid="transaction-type-error"
                className="text-xs font-medium text-destructive"
              >
                {errors.type.message}
              </p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="transaction-description">Descrição</Label>
            <Input
              id="transaction-description"
              data-testid="transaction-description-input"
              placeholder="Ex.: Compras do mês, Aluguel, Salário"
              disabled={isLoading}
              {...register("description")}
              aria-invalid={Boolean(errors.description)}
            />
            {errors.description && (
              <p
                data-testid="transaction-description-error"
                className="text-xs font-medium text-destructive"
              >
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Grid: Valor e Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="transaction-amount">Valor</Label>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <Input
                    id="transaction-amount"
                    data-testid="transaction-amount-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="R$ 0,00"
                    disabled={isLoading}
                    value={maskCurrencyBRL(field.value)}
                    onChange={(e) =>
                      field.onChange(parseCurrencyBRL(e.target.value))
                    }
                    aria-invalid={Boolean(errors.amount)}
                  />
                )}
              />
              {errors.amount && (
                <p
                  data-testid="transaction-amount-error"
                  className="text-xs font-medium text-destructive"
                >
                  {errors.amount.message}
                </p>
              )}
            </div>

            {/* Data */}
            <div className="space-y-2">
              <Label htmlFor="transaction-date">Data</Label>
              <Input
                id="transaction-date"
                data-testid="transaction-date-input"
                type="date"
                disabled={isLoading}
                {...register("date")}
                aria-invalid={Boolean(errors.date)}
              />
              {errors.date && (
                <p
                  data-testid="transaction-date-error"
                  className="text-xs font-medium text-destructive"
                >
                  {errors.date.message}
                </p>
              )}
            </div>
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="transaction-category">Categoria</Label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => {
                const categoryLabels = Object.fromEntries(
                  availableCategories.map((c) => [c.id, c.name])
                );

                return (
                  <Select
                    items={categoryLabels}
                    itemToStringLabel={(val) =>
                      val ? categoryLabels[String(val)] ?? String(val) : ""
                    }
                    value={field.value || null}
                    onValueChange={(val) => field.onChange(val ?? "")}
                    disabled={isLoading}
                  >
                    <SelectTrigger
                      id="transaction-category"
                      data-testid="transaction-category-select"
                      className="w-full"
                    >
                      <SelectValue placeholder="Selecione uma categoria..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.length === 0 ? (
                        <div className="p-2 text-xs text-muted-foreground text-center">
                          Nenhuma categoria deste tipo cadastrada.
                        </div>
                      ) : (
                        availableCategories.map((cat) => (
                          <SelectItem
                            key={cat.id}
                            value={cat.id}
                            label={cat.name}
                            data-testid={`transaction-category-option-${cat.id}`}
                          >
                            {cat.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                );
              }}
            />
            {errors.categoryId && (
              <p
                data-testid="transaction-category-error"
                className="text-xs font-medium text-destructive"
              >
                {errors.categoryId.message}
              </p>
            )}
          </div>

          {/* Conta Financeira (Opcional) */}
          <div className="space-y-2">
            <Label htmlFor="transaction-account">Conta Bancária (Opcional)</Label>
            <Controller
              name="accountId"
              control={control}
              render={({ field }) => {
                const accountLabels = Object.fromEntries(
                  allAccounts.map((a) => [a.id, a.name])
                );

                return (
                  <Select
                    items={accountLabels}
                    itemToStringLabel={(val) =>
                      val ? accountLabels[String(val)] ?? String(val) : ""
                    }
                    value={field.value ?? null}
                    onValueChange={(val) => field.onChange(val || null)}
                    disabled={isLoading}
                  >
                    <SelectTrigger
                      id="transaction-account"
                      data-testid="transaction-account-select"
                      className="w-full"
                    >
                      <SelectValue placeholder="Selecione uma conta (opcional)..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allAccounts.map((acc) => (
                        <SelectItem
                          key={acc.id}
                          value={acc.id}
                          label={acc.name}
                          data-testid={`transaction-account-option-${acc.id}`}
                        >
                          {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              }}
            />
          </div>

          {/* Observações (Opcional) */}
          <div className="space-y-2">
            <Label htmlFor="transaction-notes">Observações (Opcional)</Label>
            <Input
              id="transaction-notes"
              data-testid="transaction-notes-input"
              placeholder="Notas adicionais sobre a transação..."
              disabled={isLoading}
              {...register("notes")}
            />
          </div>

          <DialogFooter className="mt-6 pt-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              data-testid="transaction-cancel-button"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="lg"
              data-testid="transaction-submit-button"
              disabled={isLoading}
              className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              {isEditing ? "Salvar Alterações" : "Criar Transação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
