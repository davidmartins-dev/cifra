import { apiClient } from "@/lib/api-client";
import type {
  CategorySummary,
  CategorySummaryFilters,
  FinancialOverview,
  FinancialSummaryFilters,
  MonthlyEvolution,
  MonthlyEvolutionFilters,
} from "../types/financial-summary";

export const financialSummaryService = {
  /**
   * Obtém o resumo financeiro geral através do BFF do Next.js.
   */
  getOverview: async (filters?: FinancialSummaryFilters): Promise<FinancialOverview> => {
    return apiClient.get<FinancialOverview>("/financial-summary/overview", {
      params: filters as Record<string, string | number | boolean | undefined>,
    });
  },

  /**
   * Obtém a distribuição de transações por categoria através do BFF.
   */
  getByCategory: async (filters?: CategorySummaryFilters): Promise<CategorySummary> => {
    return apiClient.get<CategorySummary>("/financial-summary/by-category", {
      params: filters as Record<string, string | number | boolean | undefined>,
    });
  },

  /**
   * Obtém a evolução mensal das receitas e despesas através do BFF.
   */
  getMonthlyEvolution: async (filters?: MonthlyEvolutionFilters): Promise<MonthlyEvolution> => {
    return apiClient.get<MonthlyEvolution>("/financial-summary/monthly-evolution", {
      params: filters as Record<string, string | number | boolean | undefined>,
    });
  },
};
