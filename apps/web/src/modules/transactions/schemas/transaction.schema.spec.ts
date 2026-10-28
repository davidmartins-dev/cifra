import { describe, it, expect } from "vitest";
import {
  createTransactionSchema,
  updateTransactionSchema,
  filterTransactionSchema,
} from "./transaction.schema";
import { TransactionType } from "../types/transaction";

describe("transaction.schema", () => {
  describe("createTransactionSchema", () => {
    it("deve validar com sucesso uma transação de despesa válida", () => {
      const validData = {
        description: "Mercado da Semana",
        amount: 250.75,
        type: TransactionType.EXPENSE,
        date: "2026-10-20T10:00:00.000Z",
        categoryId: "cat-1",
        accountId: "acc-1",
        notes: "Compras mensais",
      };

      const result = createTransactionSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("Mercado da Semana");
        expect(result.data.amount).toBe(250.75);
        expect(result.data.type).toBe(TransactionType.EXPENSE);
        expect(result.data.categoryId).toBe("cat-1");
        expect(result.data.accountId).toBe("acc-1");
      }
    });

    it("deve validar com sucesso uma transação sem conta ou observações", () => {
      const validData = {
        description: "Salário Mensal",
        amount: 5000,
        type: TransactionType.INCOME,
        date: "2026-10-05",
        categoryId: "cat-2",
      };

      const result = createTransactionSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.accountId).toBeNull();
        expect(result.data.notes).toBeNull();
      }
    });

    it("deve rejeitar descrição vazia", () => {
      const result = createTransactionSchema.safeParse({
        description: "   ",
        amount: 100,
        type: TransactionType.EXPENSE,
        date: "2026-10-20",
        categoryId: "cat-1",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("descrição");
      }
    });

    it("deve rejeitar valor zero ou negativo", () => {
      const resultZero = createTransactionSchema.safeParse({
        description: "Café",
        amount: 0,
        type: TransactionType.EXPENSE,
        date: "2026-10-20",
        categoryId: "cat-1",
      });
      expect(resultZero.success).toBe(false);

      const resultNegative = createTransactionSchema.safeParse({
        description: "Café",
        amount: -10,
        type: TransactionType.EXPENSE,
        date: "2026-10-20",
        categoryId: "cat-1",
      });
      expect(resultNegative.success).toBe(false);
    });

    it("deve rejeitar tipo inválido", () => {
      const result = createTransactionSchema.safeParse({
        description: "Café",
        amount: 10,
        type: "INVALID",
        date: "2026-10-20",
        categoryId: "cat-1",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("Receita ou Despesa");
      }
    });

    it("deve rejeitar sem categoria", () => {
      const result = createTransactionSchema.safeParse({
        description: "Café",
        amount: 10,
        type: TransactionType.EXPENSE,
        date: "2026-10-20",
        categoryId: "",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("updateTransactionSchema", () => {
    it("deve validar atualização parcial válida", () => {
      const result = updateTransactionSchema.safeParse({
        description: "Novo nome",
        amount: 300,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("Novo nome");
        expect(result.data.amount).toBe(300);
      }
    });

    it("deve rejeitar valor negativo na atualização", () => {
      const result = updateTransactionSchema.safeParse({
        amount: -50,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("filterTransactionSchema", () => {
    it("deve validar filtros válidos", () => {
      const result = filterTransactionSchema.safeParse({
        type: TransactionType.INCOME,
        page: "2",
        limit: "15",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe(TransactionType.INCOME);
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(15);
      }
    });
  });
});
