import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/test/test-utils";
import { categoriesService } from "../services/categories.service";
import {
  useCategories,
  useCategory,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  CATEGORIES_QUERY_KEY,
} from "./use-categories";
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

describe("useCategories Hooks - Testes de Integração", () => {
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
      name: "Alimentação",
      type: CategoryType.EXPENSE,
      userId: "user-1",
      createdAt: "2026-01-02T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createWrapper(queryClient = createTestQueryClient()) {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };
  }

  it("deve buscar e retornar a lista de categorias com sucesso", async () => {
    vi.mocked(categoriesService.list).mockResolvedValueOnce(mockCategories);

    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockCategories);
    expect(categoriesService.list).toHaveBeenCalledWith(undefined);
  });

  it("deve buscar categorias filtradas por tipo", async () => {
    vi.mocked(categoriesService.list).mockResolvedValueOnce([mockCategories[0]!]);

    const { result } = renderHook(() => useCategories(CategoryType.INCOME), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([mockCategories[0]]);
    expect(categoriesService.list).toHaveBeenCalledWith(CategoryType.INCOME);
  });

  it("deve buscar detalhes de uma categoria por ID", async () => {
    vi.mocked(categoriesService.getById).mockResolvedValueOnce(mockCategories[1]!);

    const { result } = renderHook(() => useCategory("cat-2"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockCategories[1]);
    expect(categoriesService.getById).toHaveBeenCalledWith("cat-2");
  });

  it("deve criar uma nova categoria e invalidar o cache", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const newCategory: Category = {
      id: "cat-3",
      name: "Educação",
      type: CategoryType.EXPENSE,
      userId: "user-1",
      createdAt: "2026-01-03T00:00:00Z",
      updatedAt: "2026-01-03T00:00:00Z",
    };

    vi.mocked(categoriesService.create).mockResolvedValueOnce(newCategory);

    const { result } = renderHook(() => useCreateCategoryMutation(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({
      name: "Educação",
      type: CategoryType.EXPENSE,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(newCategory);
    expect(categoriesService.create).toHaveBeenCalledWith({
      name: "Educação",
      type: CategoryType.EXPENSE,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: CATEGORIES_QUERY_KEY,
    });
  });

  it("deve atualizar uma categoria existente e invalidar o cache", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const updatedCategory: Category = {
      ...mockCategories[1]!,
      name: "Supermercado e Restaurantes",
    };

    vi.mocked(categoriesService.update).mockResolvedValueOnce(updatedCategory);

    const { result } = renderHook(() => useUpdateCategoryMutation(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({
      id: "cat-2",
      data: { name: "Supermercado e Restaurantes" },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(updatedCategory);
    expect(categoriesService.update).toHaveBeenCalledWith("cat-2", {
      name: "Supermercado e Restaurantes",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: CATEGORIES_QUERY_KEY,
    });
  });

  it("deve remover uma categoria e invalidar o cache", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    vi.mocked(categoriesService.delete).mockResolvedValueOnce({
      message: "Categoria removida com sucesso",
    });

    const { result } = renderHook(() => useDeleteCategoryMutation(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate("cat-2");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(categoriesService.delete).toHaveBeenCalledWith("cat-2");
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: CATEGORIES_QUERY_KEY,
    });
  });
});
