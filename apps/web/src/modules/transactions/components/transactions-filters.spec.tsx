import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import {
  TransactionsFilters,
  type TransactionFilterValues,
} from "./transactions-filters";
import { TransactionType } from "../types/transaction";

vi.mock("@/modules/categories/hooks/use-categories", () => ({
  useCategories: () => ({
    data: [
      { id: "cat-1", name: "Alimentação", type: "EXPENSE" },
      { id: "cat-2", name: "Salário", type: "INCOME" },
    ],
    isLoading: false,
  }),
}));

vi.mock("@/modules/accounts/hooks/use-accounts", () => ({
  useAccounts: () => ({
    data: [{ id: "acc-1", name: "Nubank", balance: 1000 }],
    isLoading: false,
  }),
}));

describe("TransactionsFilters Component", () => {
  const initialFilters: TransactionFilterValues = {
    search: "",
    type: "ALL",
    categoryId: "",
    accountId: "",
    startDate: "",
    endDate: "",
  };

  it("deve renderizar botões de tipo com contagens", () => {
    render(
      <TransactionsFilters
        filters={initialFilters}
        onChange={vi.fn()}
        counts={{ all: 10, income: 4, expense: 6 }}
      />
    );

    expect(screen.getByTestId("filter-all-button")).toHaveTextContent("Todas (10)");
    expect(screen.getByTestId("filter-income-button")).toHaveTextContent("Receitas (4)");
    expect(screen.getByTestId("filter-expense-button")).toHaveTextContent("Despesas (6)");
  });

  it("deve disparar onChange ao alterar tipo", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <TransactionsFilters
        filters={initialFilters}
        onChange={onChange}
      />
    );

    await user.click(screen.getByTestId("filter-income-button"));

    expect(onChange).toHaveBeenCalledWith({
      ...initialFilters,
      type: TransactionType.INCOME,
    });
  });

  it("deve disparar onChange ao digitar na busca", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <TransactionsFilters
        filters={initialFilters}
        onChange={onChange}
      />
    );

    const searchInput = screen.getByTestId("filter-search-input");
    await user.type(searchInput, "a");

    expect(onChange).toHaveBeenCalledWith({
      ...initialFilters,
      search: "a",
    });
  });
});
