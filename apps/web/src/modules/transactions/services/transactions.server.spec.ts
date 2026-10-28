import { describe, it, expect, vi, beforeEach } from "vitest";
import { transactionsServerService } from "./transactions.server";
import { proxyToBackend } from "@/modules/auth/services/auth.server";
import { TransactionType } from "../types/transaction";

vi.mock("@/modules/auth/services/auth.server", () => ({
  proxyToBackend: vi.fn(),
  BackendApiError: class BackendApiError extends Error {
    constructor(
      public status: number,
      message: string,
      public data?: unknown
    ) {
      super(message);
    }
  },
}));

describe("transactionsServerService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve chamar proxyToBackend repassando cookieHeader e filtros", async () => {
    vi.mocked(proxyToBackend).mockResolvedValueOnce({
      data: [],
      response: { status: 200 } as Response,
    });

    await transactionsServerService.list(
      { type: TransactionType.INCOME },
      "session=123"
    );

    expect(proxyToBackend).toHaveBeenCalledWith("/transactions?type=INCOME", {
      method: "GET",
      headers: { cookie: "session=123" },
    });
  });

  it("deve chamar proxyToBackend para getById", async () => {
    vi.mocked(proxyToBackend).mockResolvedValueOnce({
      data: { id: "tx-1" },
      response: { status: 200 } as Response,
    });

    await transactionsServerService.getById("tx-1", "session=123");

    expect(proxyToBackend).toHaveBeenCalledWith("/transactions/tx-1", {
      method: "GET",
      headers: { cookie: "session=123" },
    });
  });

  it("deve chamar proxyToBackend para criação", async () => {
    const dto = {
      description: "Cinema",
      amount: 45,
      type: TransactionType.EXPENSE,
      date: "2026-10-22",
      categoryId: "cat-1",
    };
    vi.mocked(proxyToBackend).mockResolvedValueOnce({
      data: { id: "tx-1", ...dto },
      response: { status: 201 } as Response,
    });

    await transactionsServerService.create(dto, "session=123");

    expect(proxyToBackend).toHaveBeenCalledWith("/transactions", {
      method: "POST",
      headers: { cookie: "session=123" },
      body: JSON.stringify(dto),
    });
  });

  it("deve chamar proxyToBackend para exclusão", async () => {
    vi.mocked(proxyToBackend).mockResolvedValueOnce({
      data: { message: "OK" },
      response: { status: 200 } as Response,
    });

    await transactionsServerService.delete("tx-1", "session=123");

    expect(proxyToBackend).toHaveBeenCalledWith("/transactions/tx-1", {
      method: "DELETE",
      headers: { cookie: "session=123" },
    });
  });
});
