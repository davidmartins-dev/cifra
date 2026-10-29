export type TransactionType = 'INCOME' | 'EXPENSE';

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

export interface CategorySummaryItem {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface CategorySummary {
  type: TransactionType;
  totalAmount: number;
  categories: CategorySummaryItem[];
}

export interface CategorySummaryFilters extends FinancialSummaryFilters {
  type?: TransactionType;
}

export interface MonthData {
  month: number;
  monthName: string;
  income: number;
  expense: number;
  net: number;
}

export interface MonthlyEvolution {
  year: number;
  totalIncome: number;
  totalExpense: number;
  netTotal: number;
  months: MonthData[];
}

export interface MonthlyEvolutionFilters {
  year?: number;
}
