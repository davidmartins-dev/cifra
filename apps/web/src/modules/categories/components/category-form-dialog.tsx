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
  createCategorySchema,
  CreateCategoryInput,
  CreateCategoryFormData,
} from "../schemas/category.schema";
import { Category, CategoryType } from "../types/category";
import { CATEGORY_TYPE_LABELS } from "./category-card";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryToEdit?: Category | null;
  onSubmit: (data: CreateCategoryFormData) => Promise<void>;
  isLoading?: boolean;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  categoryToEdit,
  onSubmit,
  isLoading = false,
}: CategoryFormDialogProps) {
  const isEditing = Boolean(categoryToEdit);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateCategoryInput, undefined, CreateCategoryFormData>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      type: undefined,
    },
  });

  React.useEffect(() => {
    if (open) {
      if (categoryToEdit) {
        reset({
          name: categoryToEdit.name,
          type: categoryToEdit.type,
        });
      } else {
        reset({
          name: "",
          type: undefined,
        });
      }
    }
  }, [open, categoryToEdit, reset]);

  const handleFormSubmit = async (data: CreateCategoryFormData) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="category-form-dialog"
        className="sm:max-w-110"
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Categoria" : "Nova Categoria"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações da sua categoria."
              : "Cadastre uma nova categoria para organizar suas transações."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
          {/* Nome da Categoria */}
          <div className="space-y-2">
            <Label htmlFor="category-name">Nome da Categoria</Label>
            <Input
              id="category-name"
              data-testid="category-name-input"
              placeholder="Ex.: Alimentação, Moradia, Salário"
              disabled={isLoading}
              {...register("name")}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && (
              <p
                data-testid="category-name-error"
                className="text-xs font-medium text-destructive"
              >
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Tipo de Categoria */}
          <div className="space-y-2">
            <Label htmlFor="category-type">Tipo de Categoria</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select
                  items={CATEGORY_TYPE_LABELS}
                  itemToStringLabel={(val) =>
                    val ? CATEGORY_TYPE_LABELS[val as CategoryType] ?? String(val) : ""
                  }
                  value={field.value ?? null}
                  onValueChange={(val) => field.onChange(val)}
                  disabled={isLoading}
                >
                  <SelectTrigger
                    id="category-type"
                    data-testid="category-type-select"
                    className="w-full"
                  >
                    <SelectValue placeholder="Selecione o tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(CategoryType).map((type) => (
                      <SelectItem
                        key={type}
                        value={type}
                        label={CATEGORY_TYPE_LABELS[type]}
                        data-testid={`category-type-option-${type}`}
                      >
                        {CATEGORY_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && (
              <p
                data-testid="category-type-error"
                className="text-xs font-medium text-destructive"
              >
                {errors.type.message}
              </p>
            )}
          </div>

          <DialogFooter className="mt-6 pt-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              data-testid="category-cancel-button"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="lg"
              data-testid="category-submit-button"
              disabled={isLoading}
              className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              {isEditing ? "Salvar Alterações" : "Criar Categoria"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
