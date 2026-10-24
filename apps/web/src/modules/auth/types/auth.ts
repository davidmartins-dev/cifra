export type UserRole = "USER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  verificationTicket: string;
}

export interface ResetPasswordDto {
  email: string;
  password: string;
  verificationTicket: string;
}

export type EmailVerificationPurpose = "SIGNUP" | "PASSWORD_RESET";

export interface SendVerificationCodeDto {
  email: string;
  purpose: EmailVerificationPurpose;
}

export interface VerifyCodeDto {
  email: string;
  code: string;
  purpose: EmailVerificationPurpose;
}

export interface VerifyCodeResponse {
  verified: boolean;
  message: string;
  verificationTicket: string;
}

export interface AuthResponse {
  message: string;
  user: User;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}
