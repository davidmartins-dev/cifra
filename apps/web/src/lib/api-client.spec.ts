import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { apiClient, ApiClientError } from "./api-client";

describe("apiClient - Utilitário HTTP", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("deve realizar GET com sucesso e retornar JSON", async () => {
    const mockData = { user: { id: "1", name: "David" } };
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockData,
    } as Response);

    const result = await apiClient.get<{ user: { id: string; name: string } }>(
      "/auth/me"
    );

    expect(result).toEqual(mockData);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/me"),
      expect.objectContaining({
        method: "GET",
        credentials: "include",
      })
    );
  });

  it("deve realizar POST com payload JSON", async () => {
    const payload = { email: "david@cifra.app" };
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: "OK" }),
    } as Response);

    await apiClient.post("/auth/login", payload);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/login"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
      })
    );
  });

  it("deve lançar ApiClientError com mensagem da API quando resposta falhar", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: async () => ({
        statusCode: 400,
        message: "E-mail ou senha incorretos",
        error: "Bad Request",
      }),
    } as Response);

    await expect(apiClient.post("/auth/login", {})).rejects.toThrow(
      ApiClientError
    );

    try {
      await apiClient.post("/auth/login", {});
    } catch (err) {
      if (err instanceof ApiClientError) {
        expect(err.status).toBe(400);
        expect(err.message).toBe("E-mail ou senha incorretos");
      }
    }
  });

  it("deve juntar mensagens em array do class-validator do NestJS", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 422,
      statusText: "Unprocessable Entity",
      json: async () => ({
        statusCode: 422,
        message: ["A senha deve ter no mínimo 8 caracteres", "A senha deve conter número"],
      }),
    } as Response);

    try {
      await apiClient.post("/auth/register", {});
    } catch (err) {
      expect(err).toBeInstanceOf(ApiClientError);
      if (err instanceof ApiClientError) {
        expect(err.status).toBe(422);
        expect(err.message).toContain("A senha deve ter no mínimo 8 caracteres, A senha deve conter número");
      }
    }
  });

  it("deve lidar com status 204 No Content retornando objeto vazio", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 204,
    } as Response);

    const result = await apiClient.delete("/auth/session");
    expect(result).toEqual({});
  });
});
