import { proxyToBackend, BackendApiError } from "@/modules/auth/services/auth.server";
import {
  Category,
  CategoryType,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "../types/category";

export { BackendApiError };

export const categoriesServerService = {
  /**
   * Lista as categorias no backend NestJS repassando o cookie de sessão do usuário.
   */
  list: async (type?: CategoryType, cookieHeader?: string | null) => {
    const endpoint = type ? `/categories?type=${encodeURIComponent(type)}` : "/categories";
    return proxyToBackend<Category[]>(endpoint, {
      method: "GET",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    });
  },

  /**
   * Obtém os detalhes de uma categoria específica no backend NestJS.
   */
  getById: async (id: string, cookieHeader?: string | null) => {
    return proxyToBackend<Category>(`/categories/${id}`, {
      method: "GET",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    });
  },

  /**
   * Cria uma nova categoria no backend NestJS.
   */
  create: async (data: CreateCategoryDto, cookieHeader?: string | null) => {
    return proxyToBackend<Category>("/categories", {
      method: "POST",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      body: JSON.stringify(data),
    });
  },

  /**
   * Atualiza dados de uma categoria no backend NestJS.
   */
  update: async (
    id: string,
    data: UpdateCategoryDto,
    cookieHeader?: string | null
  ) => {
    return proxyToBackend<Category>(`/categories/${id}`, {
      method: "PATCH",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      body: JSON.stringify(data),
    });
  },

  /**
   * Remove uma categoria no backend NestJS.
   */
  delete: async (id: string, cookieHeader?: string | null) => {
    return proxyToBackend<{ message?: string }>(`/categories/${id}`, {
      method: "DELETE",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    });
  },
};
