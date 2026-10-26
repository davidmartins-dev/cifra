import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { categoriesService } from "../services/categories.service";
import type {
  Category,
  CategoryType,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "../types/category";

export const CATEGORIES_QUERY_KEY = ["categories"] as const;

/**
 * Hook para consultar e listar as categorias do usuário (com suporte a filtro opcional por tipo).
 */
export function useCategories(
  type?: CategoryType,
  options?: Omit<UseQueryOptions<Category[], Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    ...options,
    queryKey: type ? [...CATEGORIES_QUERY_KEY, { type }] : CATEGORIES_QUERY_KEY,
    queryFn: () => categoriesService.list(type),
  });
}

/**
 * Hook para buscar detalhes de uma categoria específica por ID.
 */
export function useCategory(
  id?: string,
  options?: Omit<UseQueryOptions<Category, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    ...options,
    queryKey: [...CATEGORIES_QUERY_KEY, id],
    queryFn: () => categoriesService.getById(id!),
    enabled: !!id && (options?.enabled ?? true),
  });
}

/**
 * Mutation para criar uma nova categoria com invalidação automática da lista em cache.
 */
export function useCreateCategoryMutation(
  options?: UseMutationOptions<Category, Error, CreateCategoryDto>
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: (data: CreateCategoryDto) => categoriesService.create(data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      options?.onSuccess?.(...args);
    },
  });
}

/**
 * Mutation para atualizar uma categoria existente e sincronizar os dados em cache.
 */
export function useUpdateCategoryMutation(
  options?: UseMutationOptions<
    Category,
    Error,
    { id: string; data: UpdateCategoryDto }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryDto }) =>
      categoriesService.update(id, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      options?.onSuccess?.(...args);
    },
  });
}

/**
 * Mutation para remover uma categoria financeira e atualizar o cache.
 */
export function useDeleteCategoryMutation(
  options?: UseMutationOptions<{ message?: string }, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: (id: string) => categoriesService.delete(id),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
