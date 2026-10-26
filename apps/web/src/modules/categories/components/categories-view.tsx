"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Plus,
  Tag,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { toast } from "@repo/ui/toast";
import {
  useCategories,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "../hooks/use-categories";
import { Category, CategoryType } from "../types/category";
import { CreateCategoryFormData } from "../schemas/category.schema";
import { CategoriesList } from "./categories-list";
import { CategoryFormDialog } from "./category-form-dialog";
import { DeleteCategoryDialog } from "./delete-category-dialog";

export function CategoriesView() {
  const [selectedFilter, setSelectedFilter] = React.useState<"ALL" | CategoryType>("ALL");

  const { data: allCategories = [], isLoading } = useCategories();

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [categoryToEdit, setCategoryToEdit] = React.useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = React.useState<Category | null>(null);

  // Mutations
  const createMutation = useCreateCategoryMutation({
    onSuccess: (newCat) => {
      toast.add({
        title: "Categoria criada",
        description: `Categoria "${newCat.name}" criada com sucesso!`,
        type: "success",
      });
    },
    onError: (err) => {
      toast.add({
        title: "Erro ao criar categoria",
        description: err.message || "Erro ao criar categoria financeira.",
        type: "error",
      });
    },
  });

  const updateMutation = useUpdateCategoryMutation({
    onSuccess: (updatedCat) => {
      toast.add({
        title: "Categoria atualizada",
        description: `Categoria "${updatedCat.name}" atualizada com sucesso!`,
        type: "success",
      });
    },
    onError: (err) => {
      toast.add({
        title: "Erro ao atualizar",
        description: err.message || "Erro ao atualizar categoria financeira.",
        type: "error",
      });
    },
  });

  const deleteMutation = useDeleteCategoryMutation({
    onSuccess: () => {
      toast.add({
        title: "Categoria removida",
        description: "Categoria removida com sucesso!",
        type: "success",
      });
    },
    onError: (err) => {
      toast.add({
        title: "Erro ao excluir",
        description: err.message || "Erro ao excluir categoria financeira.",
        type: "error",
      });
    },
  });

  // Métricas calculadas
  const incomeCount = React.useMemo(() => {
    return allCategories.filter((c) => c.type === CategoryType.INCOME).length;
  }, [allCategories]);

  const expenseCount = React.useMemo(() => {
    return allCategories.filter((c) => c.type === CategoryType.EXPENSE).length;
  }, [allCategories]);

  // Lista filtrada
  const filteredCategories = React.useMemo(() => {
    if (selectedFilter === "ALL") return allCategories;
    return allCategories.filter((c) => c.type === selectedFilter);
  }, [allCategories, selectedFilter]);

  const handleOpenCreate = () => {
    setCategoryToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (category: Category) => {
    setCategoryToEdit(category);
    setIsFormOpen(true);
  };

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category);
  };

  const handleFormSubmit = async (formData: CreateCategoryFormData) => {
    if (categoryToEdit) {
      await updateMutation.mutateAsync({
        id: categoryToEdit.id,
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
            Minhas Categorias
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas categorias de receitas e despesas para classificar suas movimentações.
          </p>
        </div>

        <div>
          <Button
            size="lg"
            onClick={handleOpenCreate}
            data-testid="open-create-category-button"
            className="cursor-pointer gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Categoria</span>
          </Button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total de Categorias */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Categorias
            </CardTitle>
            <Tag className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div
              data-testid="total-categories-count"
              className="text-2xl font-bold text-foreground"
            >
              {allCategories.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              cadastradas para o seu usuário
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Receitas */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categorias de Receita
            </CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div
              data-testid="income-categories-count"
              className="text-2xl font-bold text-emerald-600 dark:text-emerald-400"
            >
              {incomeCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              entradas e ganhos
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Despesas */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categorias de Despesa
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div
              data-testid="expense-categories-count"
              className="text-2xl font-bold text-rose-600 dark:text-rose-400"
            >
              {expenseCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              gastos e pagamentos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Lista de Categorias */}
      <section className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Categorias Cadastradas
          </h2>

          {/* Abas / Filtro por Tipo */}
          <div className="inline-flex items-center rounded-lg border border-border p-1 bg-muted/40">
            <button
              type="button"
              data-testid="filter-all-button"
              onClick={() => setSelectedFilter("ALL")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                selectedFilter === "ALL"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Todas ({allCategories.length})
            </button>
            <button
              type="button"
              data-testid="filter-income-button"
              onClick={() => setSelectedFilter(CategoryType.INCOME)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                selectedFilter === CategoryType.INCOME
                  ? "bg-background text-emerald-600 shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Receitas ({incomeCount})
            </button>
            <button
              type="button"
              data-testid="filter-expense-button"
              onClick={() => setSelectedFilter(CategoryType.EXPENSE)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                selectedFilter === CategoryType.EXPENSE
                  ? "bg-background text-rose-600 shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Despesas ({expenseCount})
            </button>
          </div>
        </div>

        <CategoriesList
          categories={filteredCategories}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onNewCategory={handleOpenCreate}
        />
      </section>

      {/* Modais de Ação */}
      <CategoryFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        categoryToEdit={categoryToEdit}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <DeleteCategoryDialog
        open={Boolean(categoryToDelete)}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
        category={categoryToDelete}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </main>
  );
}
