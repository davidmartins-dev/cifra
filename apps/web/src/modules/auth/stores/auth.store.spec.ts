import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAuthStore } from "./auth.store";
import { authService } from "../services/auth.service";
import type { User } from "../types/auth";

vi.mock("../services/auth.service", () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
  },
}));

describe("useAuthStore - Estado Global de Autenticação", () => {
  const mockUser: User = {
    id: "user-123",
    email: "david@cifra.app",
    name: "David Martins",
    role: "USER",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
    });
  });

  it("deve iniciar com o estado inicial não autenticado", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.isInitialized).toBe(false);
  });

  it("deve atualizar o usuário com setUser", () => {
    useAuthStore.getState().setUser(mockUser);
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    useAuthStore.getState().setUser(null);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("deve processar login com sucesso e atualizar o estado", async () => {
    vi.mocked(authService.login).mockResolvedValueOnce({
      user: mockUser,
      message: "Login realizado com sucesso",
    });

    const user = await useAuthStore.getState().login({
      email: "david@cifra.app",
      password: "Password123!",
    });

    expect(user).toEqual(mockUser);
    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.isInitialized).toBe(true);
  });

  it("deve redefinir isLoading caso o login falhe", async () => {
    vi.mocked(authService.login).mockRejectedValueOnce(
      new Error("Credenciais inválidas")
    );

    await expect(
      useAuthStore.getState().login({
        email: "david@cifra.app",
        password: "WrongPassword123!",
      })
    ).rejects.toThrow("Credenciais inválidas");

    expect(useAuthStore.getState().isLoading).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("deve limpar o estado ao executar logout", async () => {
    useAuthStore.getState().setUser(mockUser);
    vi.mocked(authService.logout).mockResolvedValueOnce({ message: "Desconectado" });

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isInitialized).toBe(true);
  });

  it("deve hidratar usuário em checkAuth bem-sucedido", async () => {
    vi.mocked(authService.getMe).mockResolvedValueOnce({ user: mockUser });

    const user = await useAuthStore.getState().checkAuth();

    expect(user).toEqual(mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("deve resetar estado para não autenticado se checkAuth falhar", async () => {
    useAuthStore.getState().setUser(mockUser);
    vi.mocked(authService.getMe).mockRejectedValueOnce(new Error("Unauthorized"));

    const user = await useAuthStore.getState().checkAuth();

    expect(user).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
