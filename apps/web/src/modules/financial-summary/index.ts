// Types
export * from "./types/financial-summary";

// Services
export { financialSummaryService } from "./services/financial-summary.service";
export { financialSummaryServerService } from "./services/financial-summary.server";

// Hooks
export {
  useFinancialOverview,
  useCategorySummary,
  useMonthlyEvolution,
  FINANCIAL_SUMMARY_QUERY_KEY,
} from "./hooks/use-financial-summary";

// Components
export {
  FinancialOverviewCards,
  type FinancialOverviewCardsProps,
} from "./components/financial-overview-cards";
export {
  CategorySummaryBreakdown,
  type CategorySummaryBreakdownProps,
} from "./components/category-summary-breakdown";
export {
  MonthlyEvolutionChart,
  type MonthlyEvolutionChartProps,
} from "./components/monthly-evolution-chart";
export {
  FinancialSummaryView,
  type FinancialSummaryViewProps,
} from "./components/financial-summary-view";

