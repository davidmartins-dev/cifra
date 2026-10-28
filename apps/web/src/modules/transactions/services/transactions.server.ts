import { proxyToBackend, BackendApiError } from "@/modules/auth/services/auth.server";
import {
  Transaction,
  CreateTransactionDto,
  UpdateTransactionDto,
  FilterTransactionDto,
} from "../types/transaction";

export { BackendApiError };

export const transactionsServerService = {
  /**
   * Lista as transações no backend NestJS repassando o cookie de sessão do usuário.
   */
  list: async (filters?: FilterTransactionDto, cookieHeader?: string | null) => {
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

    return proxyToBackend<Transaction[]>(endpoint, {
      method: "GET",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    });
  },

  /**
   * Obtém os detalhes de uma transação específica no backend NestJS.
   */
  getById: async (id: string, cookieHeader?: string | null) => {
    return proxyToBackend<Transaction>(`/transactions/${id}`, {
      method: "GET",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    });
  },

  /**
   * Cria uma nova transação financeira no backend NestJS.
   */
  create: async (data: CreateTransactionDto, cookieHeader?: string | null) => {
    return proxyToBackend<Transaction>("/transactions", {
      method: "POST",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      body: JSON.stringify(data),
    });
  },

  /**
   * Atualiza dados de uma transação no backend NestJS.
   */
  update: async (
    id: string,
    data: UpdateTransactionDto,
    cookieHeader?: string | null
  ) => {
    return proxyToBackend<Transaction>(`/transactions/${id}`, {
      method: "PATCH",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      body: JSON.stringify(data),
    });
  },

  /**
   * Remove uma transação financeira no backend NestJS.
   */
  delete: async (id: string, cookieHeader?: string | null) => {
    return proxyToBackend<{ message?: string }>(`/transactions/${id}`, {
      method: "DELETE",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    });
  },
};
