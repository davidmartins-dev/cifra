import { apiClient } from "@/lib/api-client";
import {
  Category,
  CategoryType,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "../types/category";

export const categoriesService = {
  /**
   * Obtém a lista de todas as categorias do usuário autenticado (opcionalmente filtrado por tipo).
   */
  list: async (type?: CategoryType): Promise<Category[]> => {
    const endpoint = type ? `/categories?type=${encodeURIComponent(type)}` : "/categories";
    return apiClient.get<Category[]>(endpoint);
  },

  /**
   * Busca os detalhes de uma categoria específica pelo ID.
   */
  getById: async (id: string): Promise<Category> => {
    return apiClient.get<Category>(`/categories/${id}`);
  },

  /**
   * Cria uma nova categoria.
   */
  create: async (data: CreateCategoryDto): Promise<Category> => {
    return apiClient.post<Category>("/categories", data);
  },

  /**
   * Atualiza os dados de uma categoria existente.
   */
  update: async (id: string, data: UpdateCategoryDto): Promise<Category> => {
    return apiClient.patch<Category>(`/categories/${id}`, data);
  },

  /**
   * Remove uma categoria financeira.
   */
  delete: async (id: string): Promise<{ message?: string }> => {
    return apiClient.delete<{ message?: string }>(`/categories/${id}`);
  },
};
