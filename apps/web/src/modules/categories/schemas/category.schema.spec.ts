import { describe, it, expect } from "vitest";
import { createCategorySchema, updateCategorySchema } from "./category.schema";
import { CategoryType } from "../types/category";

describe("Category Schemas - Validações Unitárias", () => {
  describe("createCategorySchema", () => {
    it("deve aprovar dados válidos com nome e tipo INCOME", () => {
      const result = createCategorySchema.safeParse({
        name: "Salário",
        type: CategoryType.INCOME,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Salário");
        expect(result.data.type).toBe(CategoryType.INCOME);
      }
    });

    it("deve aprovar dados válidos com nome e tipo EXPENSE", () => {
      const result = createCategorySchema.safeParse({
        name: "Alimentação",
        type: CategoryType.EXPENSE,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Alimentação");
        expect(result.data.type).toBe(CategoryType.EXPENSE);
      }
    });

    it("deve aplicar trim no nome da categoria", () => {
      const result = createCategorySchema.safeParse({
        name: "   Transporte   ",
        type: CategoryType.EXPENSE,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Transporte");
      }
    });

    it("deve rejeitar nome de categoria vazio ou composto apenas por espaços", () => {
      const result = createCategorySchema.safeParse({
        name: "    ",
        type: CategoryType.EXPENSE,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("obrigatório");
      }
    });

    it("deve rejeitar nome com mais de 100 caracteres", () => {
      const result = createCategorySchema.safeParse({
        name: "a".repeat(101),
        type: CategoryType.INCOME,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("máximo 100 caracteres");
      }
    });

    it("deve rejeitar tipo de categoria inválido", () => {
      const result = createCategorySchema.safeParse({
        name: "Investimentos",
        type: "INVALID_TYPE" as unknown as CategoryType,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("inválido");
      }
    });
  });

  describe("updateCategorySchema", () => {
    it("deve permitir atualização apenas do nome", () => {
      const result = updateCategorySchema.safeParse({
        name: "Educação e Cursos",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Educação e Cursos");
        expect(result.data.type).toBeUndefined();
      }
    });

    it("deve permitir atualização apenas do tipo", () => {
      const result = updateCategorySchema.safeParse({
        type: CategoryType.INCOME,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBeUndefined();
        expect(result.data.type).toBe(CategoryType.INCOME);
      }
    });

    it("deve rejeitar tipo inválido na atualização", () => {
      const result = updateCategorySchema.safeParse({
        type: "OUTRO" as unknown as CategoryType,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("inválido");
      }
    });
  });
});
