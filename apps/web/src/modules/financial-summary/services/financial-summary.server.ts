import { proxyToBackend, BackendApiError } from "@/modules/auth/services/auth.server";
import type {
  CategorySummary,
  CategorySummaryFilters,
  FinancialOverview,
  FinancialSummaryFilters,
  MonthlyEvolution,
  MonthlyEvolutionFilters,
} from "../types/financial-summary";

export { BackendApiError };

export const financialSummaryServerService = {
  /**
   * Obtém o resumo financeiro geral no backend NestJS repassando o cookie de sessão.
   */
  getOverview: async (
    filters?: FinancialSummaryFilters,
    cookieHeader?: string | null
  ): Promise<{ data: FinancialOverview; response: Response }> => {
    const params = new URLSearchParams();
    if (filters?.accountId) params.set("accountId", filters.accountId);
    if (filters?.startDate) params.set("startDate", filters.startDate);
    if (filters?.endDate) params.set("endDate", filters.endDate);

    const query = params.toString();
    const endpoint = query
      ? `/financial-summary/overview?${query}`
      : "/financial-summary/overview";

    return proxyToBackend<FinancialOverview>(endpoint, {
      method: "GET",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    });
  },

  /**
   * Obtém a distribuição de despesas/receitas por categoria repassando cookie.
   */
  getByCategory: async (
    filters?: CategorySummaryFilters,
    cookieHeader?: string | null
  ): Promise<{ data: CategorySummary; response: Response }> => {
    const params = new URLSearchParams();
    if (filters?.type) params.set("type", filters.type);
    if (filters?.accountId) params.set("accountId", filters.accountId);
    if (filters?.startDate) params.set("startDate", filters.startDate);
    if (filters?.endDate) params.set("endDate", filters.endDate);

    const query = params.toString();
    const endpoint = query
      ? `/financial-summary/by-category?${query}`
      : "/financial-summary/by-category";

    return proxyToBackend<CategorySummary>(endpoint, {
      method: "GET",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    });
  },

  /**
   * Obtém a evolução mensal das movimentações no backend NestJS.
   */
  getMonthlyEvolution: async (
    filters?: MonthlyEvolutionFilters,
    cookieHeader?: string | null
  ): Promise<{ data: MonthlyEvolution; response: Response }> => {
    const params = new URLSearchParams();
    if (filters?.year !== undefined) params.set("year", String(filters.year));

    const query = params.toString();
    const endpoint = query
      ? `/financial-summary/monthly-evolution?${query}`
      : "/financial-summary/monthly-evolution";

    return proxyToBackend<MonthlyEvolution>(endpoint, {
      method: "GET",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    });
  },
};
