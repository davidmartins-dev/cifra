import { z } from "zod";

/**
 * Schemas atômicos reutilizáveis para garantir validação de UX consistente no front-end.
 * As validações oficiais e regras de domínio residem exclusivamente no NestJS.
 */
export const emailSchema = z
  .string()
  .trim()
  .nonempty({ error: "Por favor, informe seu e-mail." })
  .pipe(z.email({ error: "Informe um e-mail válido." }));

export const passwordStrengthSchema = z
  .string()
  .min(8, { error: "A senha deve ter no mínimo 8 caracteres." })
  .regex(/[A-Z]/, { error: "A senha deve conter ao menos uma letra maiúscula." })
  .regex(/[a-z]/, { error: "A senha deve conter ao menos uma letra minúscula." })
  .regex(/[0-9]/, { error: "A senha deve conter ao menos um número." })
  .regex(/[^A-Za-z0-9]/, { error: "A senha deve conter ao menos um caractere especial." });

// Login
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().nonempty({ error: "Por favor, informe sua senha." }),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Passo de E-mail (usado tanto no Cadastro quanto na Recuperação de Senha)
export const emailStepSchema = z.object({
  email: emailSchema,
});

export type EmailStepFormData = z.infer<typeof emailStepSchema>;

export const forgotPasswordSchema = emailStepSchema;
export type ForgotPasswordFormData = EmailStepFormData;

// Passo de Código OTP de 6 dígitos
export const otpStepSchema = z.object({
  code: z
    .string()
    .trim()
    .length(6, { error: "Por favor, digite o código completo de 6 dígitos." })
    .regex(/^\d+$/, { error: "O código deve conter apenas números." }),
});

export type OtpStepFormData = z.infer<typeof otpStepSchema>;

// Passo de Perfil e Senha (Cadastro)
export const passwordStepSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, { error: "Por favor, informe seu nome." }),
    password: passwordStrengthSchema,
    confirmPassword: z.string().nonempty({ error: "Confirme sua senha." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type PasswordStepFormData = z.infer<typeof passwordStepSchema>;

// Passo de Redefinição de Senha
export const resetPasswordSchema = z
  .object({
    password: passwordStrengthSchema,
    confirmPassword: z.string().nonempty({ error: "Confirme sua nova senha." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
