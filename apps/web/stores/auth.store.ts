import { create } from "zustand";
import { authService } from "@/services/auth.service";
import { LoginDto, RegisterDto, User } from "@/types/auth";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Ações
  login: (credentials: LoginDto) => Promise<User>;
  register: (data: RegisterDto) => Promise<User>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<User | null>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  setUser: (user: User | null) => {
    set({
      user,
      isAuthenticated: !!user,
    });
  },

  login: async (credentials: LoginDto): Promise<User> => {
    set({ isLoading: true });
    try {
      const response = await authService.login(credentials);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
      });
      return response.user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data: RegisterDto): Promise<User> => {
    set({ isLoading: true });
    try {
      const response = await authService.register(data);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
      });
      return response.user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } catch {
      // Ignora erro de rede no logout para garantir limpeza do estado local
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  checkAuth: async (): Promise<User | null> => {
    set({ isLoading: true });
    try {
      const { user } = await authService.getMe();
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
      });
      return user;
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
      return null;
    }
  },
}));
