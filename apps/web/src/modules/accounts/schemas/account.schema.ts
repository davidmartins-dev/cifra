import { z } from "zod";
import { AccountType } from "../types/account";

/**
 * Preprocessor para converter valores monetários ou strings para número.
 */
const balancePreprocess = z.preprocess((val) => {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed === "") return 0;
    if (trimmed.includes("R$") || trimmed.includes(",")) {
      const clean = trimmed.replace(/[^\d,-]/g, "").replace(",", ".");
      const parsed = parseFloat(clean);
      return isNaN(parsed) ? val : parsed;
    }
    const parsed = parseFloat(trimmed);
    return isNaN(parsed) ? val : parsed;
  }
  return 0;
}, z.number({ error: "O saldo deve ser um valor numérico válido." }));

/**
 * Schema de validação para criação de contas financeiras.
 */
export const createAccountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "O nome da conta é obrigatório." })
    .max(100, { error: "O nome da conta deve ter no máximo 100 caracteres." }),
  type: z
    .enum(
      [
        AccountType.CHECKING,
        AccountType.SAVINGS,
        AccountType.INVESTMENT,
        AccountType.CASH,
        AccountType.OTHER,
      ],
      {
        error: "Tipo de conta inválido.",
      }
    )
    .default(AccountType.CHECKING),
  balance: balancePreprocess.default(0),
});

export type CreateAccountInput = z.input<typeof createAccountSchema>;
export type CreateAccountFormData = z.output<typeof createAccountSchema>;

/**
 * Schema de validação para atualização de contas financeiras.
 */
export const updateAccountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "O nome da conta é obrigatório." })
    .max(100, { error: "O nome da conta deve ter no máximo 100 caracteres." })
    .optional(),
  type: z
    .enum(
      [
        AccountType.CHECKING,
        AccountType.SAVINGS,
        AccountType.INVESTMENT,
        AccountType.CASH,
        AccountType.OTHER,
      ],
      {
        error: "Tipo de conta inválido.",
      }
    )
    .optional(),
  balance: balancePreprocess.optional(),
});

export type UpdateAccountInput = z.input<typeof updateAccountSchema>;
export type UpdateAccountFormData = z.output<typeof updateAccountSchema>;
