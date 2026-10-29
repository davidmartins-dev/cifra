import { apiClient } from "@/lib/api-client";
import { FinancialOverview, FinancialSummaryFilters } from "../types/financial-summary";

export const financialSummaryService = {
  /**
   * Obtém o resumo financeiro geral através do BFF do Next.js.
   */
  getOverview: async (filters?: FinancialSummaryFilters): Promise<FinancialOverview> => {
    return apiClient.get<FinancialOverview>("/financial-summary/overview", {
      params: filters as Record<string, string | number | boolean | undefined>,
    });
  },
};
