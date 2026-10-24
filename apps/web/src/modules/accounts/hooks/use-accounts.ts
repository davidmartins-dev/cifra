import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { accountsService } from "../services/accounts.service";
import type {
  Account,
  CreateAccountDto,
  UpdateAccountDto,
} from "../types/account";

export const ACCOUNTS_QUERY_KEY = ["accounts"] as const;

/**
 * Hook para consultar e listar todas as contas financeiras do usuário.
 */
export function useAccounts(
  options?: Omit<UseQueryOptions<Account[], Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    ...options,
    queryKey: ACCOUNTS_QUERY_KEY,
    queryFn: () => accountsService.list(),
  });
}

/**
 * Hook para buscar detalhes de uma conta específica por ID.
 */
export function useAccount(
  id?: string,
  options?: Omit<UseQueryOptions<Account, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    ...options,
    queryKey: [...ACCOUNTS_QUERY_KEY, id],
    queryFn: () => accountsService.getById(id!),
    enabled: !!id && (options?.enabled ?? true),
  });
}

/**
 * Mutation para criar uma nova conta com invalidação automática da lista em cache.
 */
export function useCreateAccountMutation(
  options?: UseMutationOptions<Account, Error, CreateAccountDto>
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: (data: CreateAccountDto) => accountsService.create(data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
      options?.onSuccess?.(...args);
    },
  });
}

/**
 * Mutation para atualizar uma conta existente e sincronizar os dados em cache.
 */
export function useUpdateAccountMutation(
  options?: UseMutationOptions<
    Account,
    Error,
    { id: string; data: UpdateAccountDto }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: ({ id, data }: { id: string; data: UpdateAccountDto }) =>
      accountsService.update(id, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
      options?.onSuccess?.(...args);
    },
  });
}

/**
 * Mutation para remover uma conta financeira e atualizar a lista em cache.
 */
export function useDeleteAccountMutation(
  options?: UseMutationOptions<{ message?: string }, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: (id: string) => accountsService.delete(id),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
