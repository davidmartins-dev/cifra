import { describe, it, expect } from "vitest";
import { createAccountSchema, updateAccountSchema } from "./account.schema";
import { AccountType } from "../types/account";

describe("Account Schemas - Validações Unitárias", () => {
  describe("createAccountSchema", () => {
    it("deve aprovar dados válidos com tipo e saldo numérico", () => {
      const result = createAccountSchema.safeParse({
        name: "Nubank",
        type: AccountType.CHECKING,
        balance: 1500.5,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Nubank");
        expect(result.data.type).toBe(AccountType.CHECKING);
        expect(result.data.balance).toBe(1500.5);
      }
    });

    it("deve aplicar trim no nome da conta", () => {
      const result = createAccountSchema.safeParse({
        name: "  Banco Inter  ",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Banco Inter");
        expect(result.data.type).toBe(AccountType.CHECKING); // Default
        expect(result.data.balance).toBe(0); // Default
      }
    });

    it("deve converter string de moeda brasileira para número", () => {
      const result = createAccountSchema.safeParse({
        name: "Carteira",
        type: AccountType.CASH,
        balance: "1.250,75",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.balance).toBe(1250.75);
      }
    });

    it("deve converter string com prefixo R$ para número", () => {
      const result = createAccountSchema.safeParse({
        name: "Poupança",
        type: AccountType.SAVINGS,
        balance: "R$ 1.250,75",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.balance).toBe(1250.75);
      }
    });

    it("deve rejeitar nome de conta vazio ou composto apenas por espaços", () => {
      const result = createAccountSchema.safeParse({
        name: "   ",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("obrigatório");
      }
    });

    it("deve rejeitar tipo de conta inválido", () => {
      const result = createAccountSchema.safeParse({
        name: "Conta Inválida",
        type: "TIPO_INEXISTENTE" as unknown as AccountType,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("inválido");
      }
    });

    it("deve rejeitar nome com mais de 100 caracteres", () => {
      const result = createAccountSchema.safeParse({
        name: "a".repeat(101),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("máximo 100 caracteres");
      }
    });
  });

  describe("updateAccountSchema", () => {
    it("deve permitir atualização parcial de campos", () => {
      const result = updateAccountSchema.safeParse({
        name: "Novo Nome",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Novo Nome");
        expect(result.data.balance).toBeUndefined();
      }
    });

    it("deve permitir atualizar apenas o saldo", () => {
      const result = updateAccountSchema.safeParse({
        balance: 3200,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.balance).toBe(3200);
      }
    });
  });
});
