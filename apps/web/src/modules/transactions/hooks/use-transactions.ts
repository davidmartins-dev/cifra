import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { transactionsService } from "../services/transactions.service";
import type {
  Transaction,
  CreateTransactionDto,
  UpdateTransactionDto,
  FilterTransactionDto,
} from "../types/transaction";

export const TRANSACTIONS_QUERY_KEY = ["transactions"] as const;

/**
 * Hook para consultar e listar as transações financeiras do usuário com filtros opcionais.
 */
export function useTransactions(
  filters?: FilterTransactionDto,
  options?: Omit<UseQueryOptions<Transaction[], Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    ...options,
    queryKey: filters
      ? [...TRANSACTIONS_QUERY_KEY, filters]
      : TRANSACTIONS_QUERY_KEY,
    queryFn: () => transactionsService.list(filters),
  });
}

/**
 * Hook para buscar detalhes de uma transação específica por ID.
 */
export function useTransaction(
  id?: string,
  options?: Omit<UseQueryOptions<Transaction, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    ...options,
    queryKey: [...TRANSACTIONS_QUERY_KEY, id],
    queryFn: () => transactionsService.getById(id!),
    enabled: !!id && (options?.enabled ?? true),
  });
}

/**
 * Mutation para registrar uma nova transação financeira e atualizar caches relacionados.
 */
export function useCreateTransactionMutation(
  options?: UseMutationOptions<Transaction, Error, CreateTransactionDto>
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: (data: CreateTransactionDto) => transactionsService.create(data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      options?.onSuccess?.(...args);
    },
  });
}

/**
 * Mutation para atualizar uma transação financeira existente e sincronizar os dados em cache.
 */
export function useUpdateTransactionMutation(
  options?: UseMutationOptions<
    Transaction,
    Error,
    { id: string; data: UpdateTransactionDto }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionDto }) =>
      transactionsService.update(id, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      options?.onSuccess?.(...args);
    },
  });
}

/**
 * Mutation para remover uma transação financeira e atualizar caches.
 */
export function useDeleteTransactionMutation(
  options?: UseMutationOptions<{ message?: string }, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: (id: string) => transactionsService.delete(id),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      options?.onSuccess?.(...args);
    },
  });
}
