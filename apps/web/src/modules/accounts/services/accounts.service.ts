import { apiClient } from "@/lib/api-client";
import {
  Account,
  CreateAccountDto,
  UpdateAccountDto,
} from "../types/account";

export const accountsService = {
  /**
   * Obtém a lista de todas as contas finceiras do usuário autenticado.
   */
  list: async (): Promise<Account[]> => {
    return apiClient.get<Account[]>("/accounts");
  },

  /**
   * Busca os detalhes de uma conta financeira específica pelo id.
   */
  getById: async (id: string): Promise<Account> => {
    return apiClient.get<Account>(`/accounts/${id}`);
  },

  /**
   * Cria uma nova conta financeira.
   */
  create: async (data: CreateAccountDto): Promise<Account> => {
    return apiClient.post<Account>("/accounts", data);
  },

  /**
   * Atualiza dados de uma conta financeira existente.
   */
  update: async (id: string, data: UpdateAccountDto): Promise<Account> => {
    return apiClient.patch<Account>(`/accounts/${id}`, data);
  },

  /**
   * Remove uma conta financeira.
   */
  delete: async (id: string): Promise<{ message?: string }> => {
    return apiClient.delete<{ message?: string }>(`/accounts/${id}`);
  },
};
