import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { authService } from "../services/auth.service";
import { useAuthStore } from "../stores/auth.store";
import type {
  AuthResponse,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  SendVerificationCodeDto,
  VerifyCodeDto,
  VerifyCodeResponse,
} from "../types/auth";

export function useLoginMutation(
  options?: UseMutationOptions<AuthResponse, Error, LoginDto>
) {
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    ...options,
    mutationFn: (credentials: LoginDto) => authService.login(credentials),
    onSuccess: (...args) => {
      setUser(args[0].user);
      options?.onSuccess?.(...args);
    },
  });
}

export function useRegisterMutation(
  options?: UseMutationOptions<AuthResponse, Error, RegisterDto>
) {
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    ...options,
    mutationFn: (data: RegisterDto) => authService.register(data),
    onSuccess: (...args) => {
      setUser(args[0].user);
      options?.onSuccess?.(...args);
    },
  });
}

export function useSendVerificationCodeMutation(
  options?: UseMutationOptions<{ message: string }, Error, SendVerificationCodeDto>
) {
  return useMutation({
    ...options,
    mutationFn: (data: SendVerificationCodeDto) =>
      authService.sendVerificationCode(data),
  });
}

export function useVerifyCodeMutation(
  options?: UseMutationOptions<VerifyCodeResponse, Error, VerifyCodeDto>
) {
  return useMutation({
    ...options,
    mutationFn: (data: VerifyCodeDto) => authService.verifyCode(data),
  });
}

export function useResetPasswordMutation(
  options?: UseMutationOptions<{ message: string }, Error, ResetPasswordDto>
) {
  return useMutation({
    ...options,
    mutationFn: (data: ResetPasswordDto) => authService.resetPassword(data),
  });
}

export function useLogoutMutation(
  options?: UseMutationOptions<{ message: string }, Error, void>
) {
  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    ...options,
    mutationFn: () => authService.logout(),
    onSuccess: async (...args) => {
      await logout();
      options?.onSuccess?.(...args);
    },
  });
}
