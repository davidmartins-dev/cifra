"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@repo/ui/input";
import { Button } from "@repo/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { TransactionType } from "../types/transaction";
import { useCategories } from "@/modules/categories/hooks/use-categories";
import { useAccounts } from "@/modules/accounts/hooks/use-accounts";

export interface TransactionFilterValues {
  search: string;
  type: "ALL" | TransactionType;
  categoryId: string;
  accountId: string;
  startDate: string;
  endDate: string;
}

interface TransactionsFiltersProps {
  filters: TransactionFilterValues;
  onChange: (filters: TransactionFilterValues) => void;
  counts?: {
    all: number;
    income: number;
    expense: number;
  };
}

export function TransactionsFilters({
  filters,
  onChange,
  counts,
}: TransactionsFiltersProps) {
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value });
  };

  const handleTypeChange = (type: "ALL" | TransactionType) => {
    onChange({ ...filters, type });
  };

  const handleCategoryChange = (categoryId: string) => {
    onChange({ ...filters, categoryId });
  };

  const handleAccountChange = (accountId: string) => {
    onChange({ ...filters, accountId });
  };

  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.type !== "ALL" ||
    Boolean(filters.categoryId) ||
    Boolean(filters.accountId) ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate);

  const handleClearFilters = () => {
    onChange({
      search: "",
      type: "ALL",
      categoryId: "",
      accountId: "",
      startDate: "",
      endDate: "",
    });
  };

  const categoryLabels = Object.fromEntries(
    categories.map((c) => [c.id, c.name])
  );
  const accountLabels = Object.fromEntries(accounts.map((a) => [a.id, a.name]));

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Abas de Tipo */}
        <div className="inline-flex items-center rounded-lg border border-border p-1 bg-muted/40 w-fit">
          <button
            type="button"
            data-testid="filter-all-button"
            onClick={() => handleTypeChange("ALL")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              filters.type === "ALL"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Todas {counts ? `(${counts.all})` : ""}
          </button>
          <button
            type="button"
            data-testid="filter-income-button"
            onClick={() => handleTypeChange(TransactionType.INCOME)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              filters.type === TransactionType.INCOME
                ? "bg-background text-emerald-600 shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Receitas {counts ? `(${counts.income})` : ""}
          </button>
          <button
            type="button"
            data-testid="filter-expense-button"
            onClick={() => handleTypeChange(TransactionType.EXPENSE)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              filters.type === TransactionType.EXPENSE
                ? "bg-background text-rose-600 shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Despesas {counts ? `(${counts.expense})` : ""}
          </button>
        </div>

        {/* Busca por descrição */}
        <div className="relative flex-1 sm:max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            data-testid="filter-search-input"
            type="text"
            placeholder="Buscar por descrição..."
            value={filters.search}
            onChange={handleSearchChange}
            className="pl-9 h-9 text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* Linha de filtros adicionais */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {/* Filtro por Categoria */}
        <div className="w-44">
          <Select
            items={categoryLabels}
            itemToStringLabel={(val) =>
              val ? categoryLabels[String(val)] ?? String(val) : ""
            }
            value={filters.categoryId || null}
            onValueChange={(val) => handleCategoryChange(val ?? "")}
          >
            <SelectTrigger
              data-testid="filter-category-select"
              aria-label="Filtrar por categoria"
              className="h-8 text-xs w-full"
            >
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem
                  key={cat.id}
                  value={cat.id}
                  label={cat.name}
                  data-testid={`filter-category-option-${cat.id}`}
                >
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtro por Conta */}
        <div className="w-44">
          <Select
            items={accountLabels}
            itemToStringLabel={(val) =>
              val ? accountLabels[String(val)] ?? String(val) : ""
            }
            value={filters.accountId || null}
            onValueChange={(val) => handleAccountChange(val ?? "")}
          >
            <SelectTrigger
              data-testid="filter-account-select"
              aria-label="Filtrar por conta"
              className="h-8 text-xs w-full"
            >
              <SelectValue placeholder="Todas as contas" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((acc) => (
                <SelectItem
                  key={acc.id}
                  value={acc.id}
                  label={acc.name}
                  data-testid={`filter-account-option-${acc.id}`}
                >
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-testid="clear-filters-button"
            onClick={handleClearFilters}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <X className="h-3 w-3" />
            Limpar Filtros
          </Button>
        )}
      </div>
    </div>
  );
}
