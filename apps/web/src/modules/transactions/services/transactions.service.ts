import { apiClient } from "@/lib/api-client";
import {
  Transaction,
  CreateTransactionDto,
  UpdateTransactionDto,
  FilterTransactionDto,
} from "../types/transaction";

export const transactionsService = {
  /**
   * Obtém a lista de transações financeiras do usuário autenticado com filtros opcionais.
   */
  list: async (filters?: FilterTransactionDto): Promise<Transaction[]> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.set("startDate", filters.startDate);
    if (filters?.endDate) params.set("endDate", filters.endDate);
    if (filters?.type) params.set("type", filters.type);
    if (filters?.categoryId) params.set("categoryId", filters.categoryId);
    if (filters?.accountId) params.set("accountId", filters.accountId);
    if (filters?.page) params.set("page", String(filters.page));
    if (filters?.limit) params.set("limit", String(filters.limit));

    const query = params.toString();
    const endpoint = query ? `/transactions?${query}` : "/transactions";
    return apiClient.get<Transaction[]>(endpoint);
  },

  /**
   * Busca os detalhes de uma transação financeira específica pelo ID.
   */
  getById: async (id: string): Promise<Transaction> => {
    return apiClient.get<Transaction>(`/transactions/${id}`);
  },

  /**
   * Cria uma nova transação financeira vinculada a categoria e conta.
   */
  create: async (data: CreateTransactionDto): Promise<Transaction> => {
    return apiClient.post<Transaction>("/transactions", data);
  },

  /**
   * Atualiza dados de uma transação financeira existente.
   */
  update: async (
    id: string,
    data: UpdateTransactionDto
  ): Promise<Transaction> => {
    return apiClient.patch<Transaction>(`/transactions/${id}`, data);
  },

  /**
   * Remove uma transação financeira.
   */
  delete: async (id: string): Promise<{ message?: string }> => {
    return apiClient.delete<{ message?: string }>(`/transactions/${id}`);
  },
};
