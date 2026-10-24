import { describe, it, expect } from "vitest";
import {
  unmask,
  maskCurrencyBRL,
  parseCurrencyBRL,
  maskCPF,
  maskCNPJ,
  maskPhone,
  maskCEP,
  maskDate,
} from "./masks";

describe("Utils - Masks Centralizadas", () => {
  describe("unmask", () => {
    it("deve remover caracteres não numéricos", () => {
      expect(unmask("123.456.789-00")).toBe("12345678900");
      expect(unmask("R$ 1.500,50")).toBe("150050");
    });
  });

  describe("maskCurrencyBRL & parseCurrencyBRL", () => {
    it("deve formatar valores numéricos em moeda BRL", () => {
      expect(maskCurrencyBRL(0)).toMatch(/R\$\s*0,00/);
      expect(maskCurrencyBRL(1500.5)).toMatch(/R\$\s*1\.500,50/);
    });

    it("deve formatar strings de dígitos em moeda BRL", () => {
      expect(maskCurrencyBRL("150000")).toMatch(/R\$\s*1\.500,00/);
      expect(maskCurrencyBRL("")).toMatch(/R\$\s*0,00/);
      expect(maskCurrencyBRL(null)).toMatch(/R\$\s*0,00/);
    });

    it("deve converter valor mascarado para número float", () => {
      expect(parseCurrencyBRL("R$ 1.500,50")).toBe(1500.5);
      expect(parseCurrencyBRL(2500)).toBe(2500);
      expect(parseCurrencyBRL("")).toBe(0);
      expect(parseCurrencyBRL(null)).toBe(0);
    });
  });

  describe("maskCPF", () => {
    it("deve aplicar máscara de CPF", () => {
      expect(maskCPF("12345678900")).toBe("123.456.789-00");
    });
  });

  describe("maskCNPJ", () => {
    it("deve aplicar máscara de CNPJ", () => {
      expect(maskCNPJ("12345678000199")).toBe("12.3456.78/0001-99".replace("3456", "345.678").replace(".78/", "/"));
      expect(maskCNPJ("12345678000199")).toBe("12.345.678/0001-99");
    });
  });

  describe("maskPhone", () => {
    it("deve aplicar máscara de telefone celular com 9 dígitos", () => {
      expect(maskPhone("11987654321")).toBe("(11) 98765-4321");
    });

    it("deve aplicar máscara de telefone fixo com 8 dígitos", () => {
      expect(maskPhone("1133334444")).toBe("(11) 3333-4444");
    });
  });

  describe("maskCEP", () => {
    it("deve aplicar máscara de CEP", () => {
      expect(maskCEP("01234567")).toBe("01234-567");
    });
  });

  describe("maskDate", () => {
    it("deve aplicar máscara de data", () => {
      expect(maskDate("24102026")).toBe("24/10/2026");
    });
  });
});
