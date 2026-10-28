import { describe, it, expect, vi, beforeEach } from "vitest";
import { transactionsService } from "./transactions.service";
import { apiClient } from "@/lib/api-client";
import { TransactionType } from "../types/transaction";

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("transactionsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve chamar apiClient.get com query params corretos na listagem", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([]);

    await transactionsService.list({
      type: TransactionType.EXPENSE,
      page: 1,
      limit: 20,
    });

    expect(apiClient.get).toHaveBeenCalledWith(
      "/transactions?type=EXPENSE&page=1&limit=20"
    );
  });

  it("deve chamar apiClient.get sem params quando nenhum filtro for passado", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([]);

    await transactionsService.list();

    expect(apiClient.get).toHaveBeenCalledWith("/transactions");
  });

  it("deve chamar apiClient.get com id para buscar detalhes", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ id: "tx-1" });

    const result = await transactionsService.getById("tx-1");

    expect(apiClient.get).toHaveBeenCalledWith("/transactions/tx-1");
    expect(result).toEqual({ id: "tx-1" });
  });

  it("deve chamar apiClient.post com dados na criação", async () => {
    const dto = {
      description: "Salário",
      amount: 5000,
      type: TransactionType.INCOME,
      date: "2026-10-01",
      categoryId: "cat-1",
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ id: "tx-1", ...dto });

    const result = await transactionsService.create(dto);

    expect(apiClient.post).toHaveBeenCalledWith("/transactions", dto);
    expect(result).toHaveProperty("id", "tx-1");
  });

  it("deve chamar apiClient.patch na atualização", async () => {
    const dto = { amount: 6000 };
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ id: "tx-1", ...dto });

    await transactionsService.update("tx-1", dto);

    expect(apiClient.patch).toHaveBeenCalledWith("/transactions/tx-1", dto);
  });

  it("deve chamar apiClient.delete na remoção", async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ message: "OK" });

    await transactionsService.delete("tx-1");

    expect(apiClient.delete).toHaveBeenCalledWith("/transactions/tx-1");
  });
});
