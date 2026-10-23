import { apiClient } from "@/lib/api-client";
import {
  AuthResponse,
  LoginDto,
  RegisterDto,
  SendVerificationCodeDto,
  User,
  VerifyCodeDto,
  VerifyCodeResponse,
  ResetPasswordDto,
} from "../types/auth";

export const authService = {
  /**
   * Realiza login do usuário com email e senha
   * A API responderá com os dados do usuário e injetará o cookie HttpOnly de sessão
   */
  login: async (credentials: LoginDto): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>("/auth/login", credentials);
  },

  /**
   * Cadastra o usuário utilizando os dados e o ticket de validação de e-mail prévio
   */
  register: async (data: RegisterDto): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>("/auth/register", data);
  },

  /**
   * Obtém os dados do perfil do usuário atualmente autenticado
   */
  getMe: async (): Promise<{ user: User }> => {
    return apiClient.get<{ user: User }>("/auth/me");
  },

  /**
   * Encerra a sessão do usuário removendo o cookie HttpOnly no servidor
   */
  logout: async (): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>("/auth/logout");
  },

  /**
   * Dispara o envio de código OTP de 6 dígitos para o e-mail informado
   */
  sendVerificationCode: async (
    data: SendVerificationCodeDto
  ): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>("/auth/email-verification/send", data);
  },

  /**
   * Valida o código OTP de 6 dígitos enviado por e-mail e obtém o ticket de verificação
   */
  verifyCode: async (data: VerifyCodeDto): Promise<VerifyCodeResponse> => {
    return apiClient.post<VerifyCodeResponse>("/auth/email-verification/verify", data);
  },

  /**
   * Redefine a senha do usuário utilizando o ticket de verificação
   */
  resetPassword: async (data: ResetPasswordDto): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>("/auth/reset-password", data);
  },
};
