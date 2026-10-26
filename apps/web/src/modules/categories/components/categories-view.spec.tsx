import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { renderWithProviders } from "@/test/test-utils";
import { CategoriesView } from "./categories-view";
import { categoriesService } from "../services/categories.service";
import { CategoryType, type Category } from "../types/category";

vi.mock("../services/categories.service", () => ({
  categoriesService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("CategoriesView Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCategories: Category[] = [
    {
      id: "cat-1",
      name: "Salário",
      type: CategoryType.INCOME,
      userId: "user-1",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "cat-2",
      name: "Freelance",
      type: CategoryType.INCOME,
      userId: "user-1",
      createdAt: "2026-01-02T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
    },
    {
      id: "cat-3",
      name: "Alimentação",
      type: CategoryType.EXPENSE,
      userId: "user-1",
      createdAt: "2026-01-03T00:00:00Z",
      updatedAt: "2026-01-03T00:00:00Z",
    },
  ];

  it("deve renderizar o título e o estado vazio quando não houver categorias", async () => {
    vi.mocked(categoriesService.list).mockResolvedValueOnce([]);

    renderWithProviders(<CategoriesView />);

    expect(screen.getByText("Minhas Categorias")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("categories-empty-state")).toBeInTheDocument();
      expect(screen.getByText("Nenhuma categoria cadastrada")).toBeInTheDocument();
    });

    expect(screen.getByTestId("total-categories-count")).toHaveTextContent("0");
    expect(screen.getByTestId("income-categories-count")).toHaveTextContent("0");
    expect(screen.getByTestId("expense-categories-count")).toHaveTextContent("0");
  });

  it("deve calcular e renderizar contadores e cards das categorias", async () => {
    vi.mocked(categoriesService.list).mockResolvedValueOnce(mockCategories);

    renderWithProviders(<CategoriesView />);

    await waitFor(() => {
      expect(screen.getByTestId("categories-grid")).toBeInTheDocument();
    });

    expect(screen.getByTestId("total-categories-count")).toHaveTextContent("3");
    expect(screen.getByTestId("income-categories-count")).toHaveTextContent("2");
    expect(screen.getByTestId("expense-categories-count")).toHaveTextContent("1");

    expect(screen.getByText("Salário")).toBeInTheDocument();
    expect(screen.getByText("Freelance")).toBeInTheDocument();
    expect(screen.getByText("Alimentação")).toBeInTheDocument();
  });

  it("deve filtrar categorias ao clicar nos botões de filtro", async () => {
    const user = userEvent.setup();
    vi.mocked(categoriesService.list).mockResolvedValueOnce(mockCategories);

    renderWithProviders(<CategoriesView />);

    await waitFor(() => {
      expect(screen.getByText("Salário")).toBeInTheDocument();
    });

    // Filtra apenas Receitas
    const filterIncomeBtn = screen.getByTestId("filter-income-button");
    await user.click(filterIncomeBtn);

    expect(screen.getByText("Salário")).toBeInTheDocument();
    expect(screen.getByText("Freelance")).toBeInTheDocument();
    expect(screen.queryByText("Alimentação")).not.toBeInTheDocument();

    // Filtra apenas Despesas
    const filterExpenseBtn = screen.getByTestId("filter-expense-button");
    await user.click(filterExpenseBtn);

    expect(screen.queryByText("Salário")).not.toBeInTheDocument();
    expect(screen.queryByText("Freelance")).not.toBeInTheDocument();
    expect(screen.getByText("Alimentação")).toBeInTheDocument();
  });

  it("deve abrir o modal de nova categoria ao clicar no botão Nova Categoria", async () => {
    const user = userEvent.setup();
    vi.mocked(categoriesService.list).mockResolvedValueOnce([]);

    renderWithProviders(<CategoriesView />);

    await waitFor(() => {
      expect(screen.getByTestId("categories-empty-state")).toBeInTheDocument();
    });

    const newBtn = screen.getByTestId("open-create-category-button");
    await user.click(newBtn);

    await waitFor(() => {
      const dialog = screen.getByTestId("category-form-dialog");
      expect(dialog).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Nova Categoria" })).toBeInTheDocument();
    });
  });
});
