import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/test/test-utils";
import { accountsService } from "../services/accounts.service";
import {
  useAccounts,
  useAccount,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
  ACCOUNTS_QUERY_KEY,
} from "./use-accounts";
import { AccountType, type Account } from "../types/account";

vi.mock("../services/accounts.service", () => ({
  accountsService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("useAccounts Hooks - Testes de Integração", () => {
  const mockAccounts: Account[] = [
    {
      id: "acc-1",
      name: "Nubank",
      type: AccountType.CHECKING,
      balance: 1000,
      userId: "user-1",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "acc-2",
      name: "Inter Poupança",
      type: AccountType.SAVINGS,
      balance: 5000,
      userId: "user-1",
      createdAt: "2026-01-02T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createWrapper(queryClient = createTestQueryClient()) {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };
  }

  it("deve buscar e retornar a lista de contas com sucesso", async () => {
    vi.mocked(accountsService.list).mockResolvedValueOnce(mockAccounts);

    const { result } = renderHook(() => useAccounts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockAccounts);
    expect(accountsService.list).toHaveBeenCalledTimes(1);
  });

  it("deve buscar detalhes de uma conta específica por ID", async () => {
    vi.mocked(accountsService.getById).mockResolvedValueOnce(mockAccounts[0]!);

    const { result } = renderHook(() => useAccount("acc-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockAccounts[0]);
    expect(accountsService.getById).toHaveBeenCalledWith("acc-1");
  });

  it("deve criar uma nova conta e invalidar o cache da lista", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const newAccount: Account = {
      id: "acc-3",
      name: "Carteira Física",
      type: AccountType.CASH,
      balance: 200,
      userId: "user-1",
      createdAt: "2026-01-03T00:00:00Z",
      updatedAt: "2026-01-03T00:00:00Z",
    };

    vi.mocked(accountsService.create).mockResolvedValueOnce(newAccount);

    const { result } = renderHook(() => useCreateAccountMutation(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({
      name: "Carteira Física",
      type: AccountType.CASH,
      balance: 200,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(newAccount);
    expect(accountsService.create).toHaveBeenCalledWith({
      name: "Carteira Física",
      type: AccountType.CASH,
      balance: 200,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ACCOUNTS_QUERY_KEY,
    });
  });

  it("deve atualizar uma conta existente e invalidar o cache", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const updatedAccount: Account = {
      ...mockAccounts[0]!,
      name: "Nubank PJ",
      balance: 1500,
    };

    vi.mocked(accountsService.update).mockResolvedValueOnce(updatedAccount);

    const { result } = renderHook(() => useUpdateAccountMutation(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({
      id: "acc-1",
      data: { name: "Nubank PJ", balance: 1500 },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(updatedAccount);
    expect(accountsService.update).toHaveBeenCalledWith("acc-1", {
      name: "Nubank PJ",
      balance: 1500,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ACCOUNTS_QUERY_KEY,
    });
  });

  it("deve remover uma conta e invalidar o cache da lista", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    vi.mocked(accountsService.delete).mockResolvedValueOnce({
      message: "Conta removida com sucesso",
    });

    const { result } = renderHook(() => useDeleteAccountMutation(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate("acc-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(accountsService.delete).toHaveBeenCalledWith("acc-1");
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ACCOUNTS_QUERY_KEY,
    });
  });
});
