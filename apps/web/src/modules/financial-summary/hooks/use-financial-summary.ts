import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { financialSummaryService } from "../services/financial-summary.service";
import type {
  CategorySummary,
  CategorySummaryFilters,
  FinancialOverview,
  FinancialSummaryFilters,
  MonthlyEvolution,
  MonthlyEvolutionFilters,
} from "../types/financial-summary";

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

/**
 * Hook para consultar a distribuição de transações por categoria.
 */
export function useCategorySummary(
  filters?: CategorySummaryFilters,
  options?: Omit<UseQueryOptions<CategorySummary, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    ...options,
    queryKey: [...FINANCIAL_SUMMARY_QUERY_KEY, "by-category", filters],
    queryFn: () => financialSummaryService.getByCategory(filters),
  });
}

/**
 * Hook para consultar a evolução mensal de receitas e despesas.
 */
export function useMonthlyEvolution(
  filters?: MonthlyEvolutionFilters,
  options?: Omit<UseQueryOptions<MonthlyEvolution, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    ...options,
    queryKey: [...FINANCIAL_SUMMARY_QUERY_KEY, "monthly-evolution", filters],
    queryFn: () => financialSummaryService.getMonthlyEvolution(filters),
  });
}
