"use client";

import * as React from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  MoreVertical,
  Pencil,
  Tag,
  Trash2,
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
import { Category, CategoryType } from "../types/category";

interface CategoryCardProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  [CategoryType.INCOME]: "Receita",
  [CategoryType.EXPENSE]: "Despesa",
};

export function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  const isIncome = category.type === CategoryType.INCOME;
  const typeLabel = CATEGORY_TYPE_LABELS[category.type] || category.type;
  const TypeIcon = isIncome ? ArrowDownLeft : ArrowUpRight;

  return (
    <Card
      data-testid="category-card"
      className="group relative overflow-hidden transition-all duration-200 hover:shadow-md border-border/60 hover:border-border"
    >
      <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
        {/* Topo do card: Ícone + Título e Menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${
                isIncome
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              }`}
            >
              <Tag className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="font-semibold text-base leading-tight tracking-tight text-foreground line-clamp-1">
                {category.name}
              </h3>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span
                  data-testid="category-card-type-badge"
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                    isIncome
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                  }`}
                >
                  <TypeIcon className="h-3 w-3" />
                  {typeLabel}
                </span>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              data-testid={`category-actions-${category.id}`}
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Opções da categoria"
                />
              }
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                data-testid={`edit-category-btn-${category.id}`}
                onClick={() => onEdit(category)}
                className="cursor-pointer gap-2"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Editar</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                data-testid={`delete-category-btn-${category.id}`}
                onClick={() => onDelete(category)}
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
