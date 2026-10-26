"use client";

import * as React from "react";
import { PlusCircle, Tag } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import { Category } from "../types/category";
import { CategoryCard } from "./category-card";

interface CategoriesListProps {
  categories?: Category[];
  isLoading: boolean;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onNewCategory: () => void;
}

export function CategoriesList({
  categories = [],
  isLoading,
  onEdit,
  onDelete,
  onNewCategory,
}: CategoriesListProps) {
  if (isLoading) {
    return (
      <div
        data-testid="categories-loading-skeleton"
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
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <Card
        data-testid="categories-empty-state"
        className="border-dashed border-2 border-border/70 p-8 text-center"
      >
        <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Tag className="h-6 w-6" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="font-semibold text-lg text-foreground">
              Nenhuma categoria cadastrada
            </h3>
            <p className="text-sm text-muted-foreground">
              Cadastre suas categorias de receitas e despesas para classificar suas
              movimentações e acompanhar seu orçamento com precisão.
            </p>
          </div>
          <Button
            size="lg"
            onClick={onNewCategory}
            data-testid="empty-create-category-button"
            className="cursor-pointer gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Cadastrar primeira categoria</span>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      data-testid="categories-grid"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
