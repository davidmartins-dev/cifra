export const AccountType = {
  CHECKING: "CHECKING",
  SAVINGS: "SAVINGS",
  INVESTMENT: "INVESTMENT",
  CASH: "CASH",
  OTHER: "OTHER",
} as const;

export type AccountType = (typeof AccountType)[keyof typeof AccountType];

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountDto {
  name: string;
  type?: AccountType;
  balance?: number;
}

export interface UpdateAccountDto {
  name?: string;
  type?: AccountType;
  balance?: number;
}
