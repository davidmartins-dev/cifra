import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { financialSummaryService } from "../services/financial-summary.service";
import type { FinancialOverview, FinancialSummaryFilters } from "../types/financial-summary";

export const FINANCIAL_SUMMARY_QUERY_KEY = ["financial-summary"] as const;

/**
 * Hook para consultar o resumo financeiro geral do usuário autenticado.
 */
export function useFinancialOverview(
  filters?: FinancialSummaryFilters,
  options?: Omit<UseQueryOptions<FinancialOverview, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    ...options,
    queryKey: [...FINANCIAL_SUMMARY_QUERY_KEY, "overview", filters],
    queryFn: () => financialSummaryService.getOverview(filters),
  });
}
