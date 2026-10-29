export interface FinancialOverview {
  currentBalance: number;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  incomeCount: number;
  expenseCount: number;
}

export interface FinancialSummaryFilters {
  accountId?: string;
  startDate?: string;
  endDate?: string;
}
