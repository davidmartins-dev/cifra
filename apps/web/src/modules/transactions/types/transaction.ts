export const TransactionType = {
  INCOME: "INCOME",
  EXPENSE: "EXPENSE",
} as const;

export type TransactionType =
  (typeof TransactionType)[keyof typeof TransactionType];

export interface TransactionCategory {
  id: string;
  name: string;
  type: TransactionType;
}

export interface TransactionAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
  notes?: string | null;
  userId: string;
  categoryId: string;
  accountId?: string | null;
  category?: TransactionCategory;
  account?: TransactionAccount | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionDto {
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
  categoryId: string;
  accountId?: string | null;
  notes?: string | null;
}

export interface UpdateTransactionDto {
  description?: string;
  amount?: number;
  type?: TransactionType;
  date?: string;
  categoryId?: string;
  accountId?: string | null;
  notes?: string | null;
}

export interface FilterTransactionDto {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  categoryId?: string;
  accountId?: string;
  page?: number;
  limit?: number;
}
