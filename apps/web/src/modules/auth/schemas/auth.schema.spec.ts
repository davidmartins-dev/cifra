import { describe, it, expect } from "vitest";
import {
  emailSchema,
  passwordStrengthSchema,
  loginSchema,
  emailStepSchema,
  otpStepSchema,
  passwordStepSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.schema";

describe("Auth Schemas - Validações Unitárias", () => {
  describe("emailSchema", () => {
    it("deve aprovar e-mails válidos e aplicar trim", () => {
      const result = emailSchema.safeParse("  usuario@cifra.app  ");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("usuario@cifra.app");
      }
    });

    it("deve rejeitar e-mails inválidos", () => {
      const invalidEmails = ["invalido", "teste@", "@dominio.com", "teste@.com", ""];
      invalidEmails.forEach((email) => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("passwordStrengthSchema", () => {
    it("deve aprovar senha que atende a todos os critérios de segurança", () => {
      const result = passwordStrengthSchema.safeParse("SenhaForte123!");
      expect(result.success).toBe(true);
    });

    it("deve rejeitar senha com menos de 8 caracteres", () => {
      const result = passwordStrengthSchema.safeParse("Ab1!xyz");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("mínimo 8 caracteres");
      }
    });

    it("deve rejeitar senha sem letra maiúscula", () => {
      const result = passwordStrengthSchema.safeParse("senhaforte123!");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("letra maiúscula");
      }
    });

    it("deve rejeitar senha sem letra minúscula", () => {
      const result = passwordStrengthSchema.safeParse("SENHAFORTE123!");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("letra minúscula");
      }
    });

    it("deve rejeitar senha sem número", () => {
      const result = passwordStrengthSchema.safeParse("SenhaForteSemNumero!");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("ao menos um número");
      }
    });

    it("deve rejeitar senha sem caractere especial", () => {
      const result = passwordStrengthSchema.safeParse("SenhaForte1234");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("caractere especial");
      }
    });
  });

  describe("loginSchema", () => {
    it("deve aprovar credenciais válidas", () => {
      const result = loginSchema.safeParse({
        email: "usuario@cifra.app",
        password: "qualquer-senha-preenchida",
      });
      expect(result.success).toBe(true);
    });

    it("deve rejeitar campos vazios", () => {
      const result = loginSchema.safeParse({
        email: "",
        password: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("emailStepSchema", () => {
    it("deve aprovar e-mail válido para a primeira etapa", () => {
      const result = emailStepSchema.safeParse({ email: "usuario@cifra.app" });
      expect(result.success).toBe(true);
    });

    it("deve rejeitar e-mail inválido ou vazio", () => {
      expect(emailStepSchema.safeParse({ email: "" }).success).toBe(false);
      expect(emailStepSchema.safeParse({ email: "invalido" }).success).toBe(false);
    });
  });

  describe("forgotPasswordSchema", () => {
    it("deve aprovar e-mail para recuperação de senha", () => {
      const result = forgotPasswordSchema.safeParse({ email: "recuperacao@cifra.app" });
      expect(result.success).toBe(true);
    });

    it("deve rejeitar e-mail vazio ou inválido", () => {
      expect(forgotPasswordSchema.safeParse({ email: "" }).success).toBe(false);
      expect(forgotPasswordSchema.safeParse({ email: "sem-arroba" }).success).toBe(false);
    });
  });

  describe("otpStepSchema", () => {
    it("deve aprovar código de 6 dígitos numéricos", () => {
      const result = otpStepSchema.safeParse({ code: "123456" });
      expect(result.success).toBe(true);
    });

    it("deve rejeitar código com menos ou mais de 6 dígitos", () => {
      expect(otpStepSchema.safeParse({ code: "12345" }).success).toBe(false);
      expect(otpStepSchema.safeParse({ code: "1234567" }).success).toBe(false);
    });

    it("deve rejeitar código com caracteres não numéricos", () => {
      const result = otpStepSchema.safeParse({ code: "12A456" });
      expect(result.success).toBe(false);
    });
  });

  describe("passwordStepSchema (Cadastro)", () => {
    it("deve aprovar nome válido e senhas coincidentes", () => {
      const result = passwordStepSchema.safeParse({
        name: "David Martins",
        password: "SenhaForte123!",
        confirmPassword: "SenhaForte123!",
      });
      expect(result.success).toBe(true);
    });

    it("deve rejeitar nome com menos de 3 caracteres", () => {
      const result = passwordStepSchema.safeParse({
        name: "Ab",
        password: "SenhaForte123!",
        confirmPassword: "SenhaForte123!",
      });
      expect(result.success).toBe(false);
    });

    it("deve rejeitar quando as senhas não coincidem", () => {
      const result = passwordStepSchema.safeParse({
        name: "David Martins",
        password: "SenhaForte123!",
        confirmPassword: "OutraSenha123!",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("não coincidem");
      }
    });
  });

  describe("resetPasswordSchema (Recuperação de Senha)", () => {
    it("deve aprovar senhas coincidentes e seguras", () => {
      const result = resetPasswordSchema.safeParse({
        password: "NovaSenhaForte123!",
        confirmPassword: "NovaSenhaForte123!",
      });
      expect(result.success).toBe(true);
    });

    it("deve rejeitar quando as senhas diferem", () => {
      const result = resetPasswordSchema.safeParse({
        password: "NovaSenhaForte123!",
        confirmPassword: "DiferenteSenha123!",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("não coincidem");
      }
    });
  });
});
