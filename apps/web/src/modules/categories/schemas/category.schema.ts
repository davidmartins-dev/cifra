import { z } from "zod";
import { CategoryType } from "../types/category";

/**
 * Schema de validação para criação de categorias financeiras.
 */
export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "O nome da categoria é obrigatório." })
    .max(100, { error: "O nome da categoria deve ter no máximo 100 caracteres." }),
  type: z.enum([CategoryType.INCOME, CategoryType.EXPENSE], {
    error: "Tipo de categoria inválido. Opções válidas: Receita ou Despesa.",
  }),
});

export type CreateCategoryInput = z.input<typeof createCategorySchema>;
export type CreateCategoryFormData = z.output<typeof createCategorySchema>;

/**
 * Schema de validação para atualização de categorias financeiras.
 */
export const updateCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "O nome da categoria é obrigatório." })
    .max(100, { error: "O nome da categoria deve ter no máximo 100 caracteres." })
    .optional(),
  type: z
    .enum([CategoryType.INCOME, CategoryType.EXPENSE], {
      error: "Tipo de categoria inválido. Opções válidas: Receita ou Despesa.",
    })
    .optional(),
});

export type UpdateCategoryInput = z.input<typeof updateCategorySchema>;
export type UpdateCategoryFormData = z.output<typeof updateCategorySchema>;
