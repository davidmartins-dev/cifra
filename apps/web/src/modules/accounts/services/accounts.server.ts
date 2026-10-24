import { proxyToBackend, BackendApiError } from "@/modules/auth/services/auth.server";
import {
  Account,
  CreateAccountDto,
  UpdateAccountDto,
} from "../types/account";

export { BackendApiError };

export const accountsServerService = {
  /**
   * Lista as contas no backend NestJS repassando o cookie de sessão do usuário.
   */
  list: async (cookieHeader?: string | null) => {
    return proxyToBackend<Account[]>("/accounts", {
      method: "GET",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    });
  },

  /**
   * Obtém os detalhes de uma conta específica no backend NestJS.
   */
  getById: async (id: string, cookieHeader?: string | null) => {
    return proxyToBackend<Account>(`/accounts/${id}`, {
      method: "GET",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    });
  },

  /**
   * Cria uma nova conta no backend NestJS.
   */
  create: async (data: CreateAccountDto, cookieHeader?: string | null) => {
    return proxyToBackend<Account>("/accounts", {
      method: "POST",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      body: JSON.stringify(data),
    });
  },

  /**
   * Atualiza dados de uma conta no backend NestJS.
   */
  update: async (
    id: string,
    data: UpdateAccountDto,
    cookieHeader?: string | null
  ) => {
    return proxyToBackend<Account>(`/accounts/${id}`, {
      method: "PATCH",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      body: JSON.stringify(data),
    });
  },

  /**
   * Remove uma conta no backend NestJS.
   */
  delete: async (id: string, cookieHeader?: string | null) => {
    return proxyToBackend<{ message?: string }>(`/accounts/${id}`, {
      method: "DELETE",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    });
  },
};
