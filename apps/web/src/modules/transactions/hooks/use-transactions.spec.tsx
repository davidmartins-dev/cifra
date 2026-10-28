import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/test/test-utils";
import { transactionsService } from "../services/transactions.service";
import {
  useTransactions,
  useTransaction,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
  TRANSACTIONS_QUERY_KEY,
} from "./use-transactions";
import { TransactionType, type Transaction } from "../types/transaction";

vi.mock("../services/transactions.service", () => ({
  transactionsService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("useTransactions Hooks", () => {
  const mockTransactions: Transaction[] = [
    {
      id: "tx-1",
      description: "Salário",
      amount: 5000,
      type: TransactionType.INCOME,
      date: "2026-10-01T00:00:00Z",
      userId: "user-1",
      categoryId: "cat-1",
      accountId: "acc-1",
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-01T00:00:00Z",
    },
    {
      id: "tx-2",
      description: "Supermercado",
      amount: 450,
      type: TransactionType.EXPENSE,
      date: "2026-10-02T00:00:00Z",
      userId: "user-1",
      categoryId: "cat-2",
      accountId: "acc-1",
      createdAt: "2026-10-02T00:00:00Z",
      updatedAt: "2026-10-02T00:00:00Z",
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

  it("deve carregar todas as transações com useTransactions", async () => {
    vi.mocked(transactionsService.list).mockResolvedValueOnce(mockTransactions);

    const { result } = renderHook(() => useTransactions(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockTransactions);
    expect(transactionsService.list).toHaveBeenCalledWith(undefined);
  });

  it("deve carregar detalhes de uma transação com useTransaction", async () => {
    vi.mocked(transactionsService.getById).mockResolvedValueOnce(mockTransactions[0]!);

    const { result } = renderHook(() => useTransaction("tx-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockTransactions[0]);
    expect(transactionsService.getById).toHaveBeenCalledWith("tx-1");
  });

  it("deve criar transação e invalidar caches de transactions e accounts", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const newTx: Transaction = {
      id: "tx-new",
      description: "Freelance",
      amount: 1200,
      type: TransactionType.INCOME,
      date: "2026-10-15T00:00:00Z",
      userId: "user-1",
      categoryId: "cat-1",
      createdAt: "2026-10-15T00:00:00Z",
      updatedAt: "2026-10-15T00:00:00Z",
    };

    vi.mocked(transactionsService.create).mockResolvedValueOnce(newTx);

    const { result } = renderHook(() => useCreateTransactionMutation(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({
      description: "Freelance",
      amount: 1200,
      type: TransactionType.INCOME,
      date: "2026-10-15T00:00:00Z",
      categoryId: "cat-1",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: TRANSACTIONS_QUERY_KEY });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["accounts"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["financial-summary"] });
  });

  it("deve atualizar transação e invalidar queries", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    vi.mocked(transactionsService.update).mockResolvedValueOnce({
      ...mockTransactions[0]!,
      amount: 5500,
    });

    const { result } = renderHook(() => useUpdateTransactionMutation(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({
      id: "tx-1",
      data: { amount: 5500 },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: TRANSACTIONS_QUERY_KEY });
  });

  it("deve remover transação e invalidar queries", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    vi.mocked(transactionsService.delete).mockResolvedValueOnce({ message: "OK" });

    const { result } = renderHook(() => useDeleteTransactionMutation(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate("tx-1");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: TRANSACTIONS_QUERY_KEY });
  });
});
