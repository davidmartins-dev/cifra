import { NextResponse } from "next/server";
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
import { getInternalApiUrl } from "@/lib/config";

export class BackendApiError extends Error {
  public status: number;
  public data: unknown;

  constructor(status: number, message: string, data: unknown = null) {
    super(message);
    this.name = "BackendApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Repassa de forma transparente todos os cabeçalhos Set-Cookie emitidos pelo NestJS
 * para a resposta do Next.js entregue ao cliente (navegador).
 * Garante que o NestJS seja a única fonte da verdade de ciclo de vida, flags e expiração de cookies.
 */
export function forwardCookiesToClient(
  fromBackendResponse: Response,
  toClientResponse: NextResponse
): void {
  if (typeof fromBackendResponse.headers.getSetCookie === "function") {
    const cookies = fromBackendResponse.headers.getSetCookie();
    for (const cookie of cookies) {
      toClientResponse.headers.append("set-cookie", cookie);
    }
  } else {
    const cookie = fromBackendResponse.headers.get("set-cookie");
    if (cookie) {
      toClientResponse.headers.set("set-cookie", cookie);
    }
  }
}

/**
 * Executa requisição intermediária para o backend NestJS.
 */
export async function proxyToBackend<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T; response: Response }> {
  const baseUrl = getInternalApiUrl();
  const fullUrl = `${baseUrl}/${endpoint.replace(/^\//, "")}`;

  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(fullUrl, {
      ...options,
      headers,
    });
  } catch (err: unknown) {
    const errorDetails = err instanceof Error ? err.message : String(err);
    throw new BackendApiError(
      503,
      "Não foi possível conectar ao servidor. Verifique se o serviço da API está online.",
      { originalError: errorDetails }
    );
  }

  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorPayload = data as { message?: string | string[] } | null;
    const errorMessage =
      (typeof errorPayload?.message === "string" ? errorPayload.message : null) ||
      (Array.isArray(errorPayload?.message) ? errorPayload.message[0] : null) ||
      response.statusText ||
      "Erro na comunicação com a API interna";
    throw new BackendApiError(response.status, errorMessage, data);
  }

  return { data: data as T, response };
}

export const authServerService = {
  login: async (
    credentials: LoginDto
  ): Promise<{ data: AuthResponse; response: Response }> => {
    return proxyToBackend<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  register: async (
    dto: RegisterDto
  ): Promise<{ data: AuthResponse; response: Response }> => {
    return proxyToBackend<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  getMe: async (
    cookieHeader?: string | null
  ): Promise<{ data: { user: User }; response: Response }> => {
    return proxyToBackend<{ user: User }>("/auth/me", {
      method: "GET",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    });
  },

  logout: async (
    cookieHeader?: string | null
  ): Promise<{ data: { message: string }; response: Response }> => {
    return proxyToBackend<{ message: string }>("/auth/logout", {
      method: "POST",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    });
  },

  sendVerificationCode: async (
    dto: SendVerificationCodeDto
  ): Promise<{ data: { message: string }; response: Response }> => {
    return proxyToBackend<{ message: string }>("/email-verification/send", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  verifyCode: async (
    dto: VerifyCodeDto
  ): Promise<{ data: VerifyCodeResponse; response: Response }> => {
    return proxyToBackend<VerifyCodeResponse>("/email-verification/verify", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  resetPassword: async (
    dto: ResetPasswordDto
  ): Promise<{ data: { message: string }; response: Response }> => {
    return proxyToBackend<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },
};
