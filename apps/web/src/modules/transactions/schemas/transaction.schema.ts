import { z } from "zod";
import { TransactionType } from "../types/transaction";

/**
 * Schema de validação para criação de transações financeiras.
 */
export const createTransactionSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, { error: "A descrição da transação é obrigatória." })
    .max(255, { error: "A descrição deve ter no máximo 255 caracteres." }),
  amount: z.coerce
    .number({ error: "O valor da transação deve ser um número válido." })
    .positive({ error: "O valor da transação deve ser maior que zero." }),
  type: z.enum([TransactionType.INCOME, TransactionType.EXPENSE], {
    error: "Tipo de transação inválido. Opções válidas: Receita ou Despesa.",
  }),
  date: z
    .string()
    .trim()
    .min(1, { error: "A data da transação é obrigatória." }),
  categoryId: z
    .string()
    .trim()
    .min(1, { error: "A categoria é obrigatória." }),
  accountId: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val === "" || val === undefined ? null : val)),
  notes: z
    .string()
    .trim()
    .max(500, { error: "As observações devem ter no máximo 500 caracteres." })
    .optional()
    .nullable()
    .transform((val) => (val === "" || val === undefined ? null : val)),
});

export type CreateTransactionInput = z.input<typeof createTransactionSchema>;
export type CreateTransactionFormData = z.output<typeof createTransactionSchema>;

/**
 * Schema de validação para atualização de transações financeiras.
 */
export const updateTransactionSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, { error: "A descrição da transação é obrigatória." })
    .max(255, { error: "A descrição deve ter no máximo 255 caracteres." })
    .optional(),
  amount: z.coerce
    .number({ error: "O valor da transação deve ser um número válido." })
    .positive({ error: "O valor da transação deve ser maior que zero." })
    .optional(),
  type: z
    .enum([TransactionType.INCOME, TransactionType.EXPENSE], {
      error: "Tipo de transação inválido. Opções válidas: Receita ou Despesa.",
    })
    .optional(),
  date: z
    .string()
    .trim()
    .min(1, { error: "A data da transação é obrigatória." })
    .optional(),
  categoryId: z
    .string()
    .trim()
    .min(1, { error: "A categoria é obrigatória." })
    .optional(),
  accountId: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val === "" || val === undefined ? null : val)),
  notes: z
    .string()
    .trim()
    .max(500, { error: "As observações devem ter no máximo 500 caracteres." })
    .optional()
    .nullable()
    .transform((val) => (val === "" || val === undefined ? null : val)),
});

export type UpdateTransactionInput = z.input<typeof updateTransactionSchema>;
export type UpdateTransactionFormData = z.output<typeof updateTransactionSchema>;

/**
 * Schema de validação para filtros de busca de transações financeiras.
 */
export const filterTransactionSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  type: z.enum([TransactionType.INCOME, TransactionType.EXPENSE]).optional(),
  categoryId: z.string().optional(),
  accountId: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type FilterTransactionInput = z.input<typeof filterTransactionSchema>;
export type FilterTransactionFormData = z.output<typeof filterTransactionSchema>;
