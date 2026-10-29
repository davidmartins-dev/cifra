import { proxyToBackend, BackendApiError } from "@/modules/auth/services/auth.server";
import { FinancialOverview, FinancialSummaryFilters } from "../types/financial-summary";

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
};
