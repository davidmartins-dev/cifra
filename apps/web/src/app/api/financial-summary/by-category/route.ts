import { NextResponse } from "next/server";
import {
  financialSummaryServerService,
  BackendApiError,
} from "@/modules/financial-summary/services/financial-summary.server";
import type { TransactionType } from "@/modules/financial-summary/types/financial-summary";

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");
    const type = typeParam === "INCOME" || typeParam === "EXPENSE" ? (typeParam as TransactionType) : undefined;
    const accountId = searchParams.get("accountId") ?? undefined;
    const startDate = searchParams.get("startDate") ?? undefined;
    const endDate = searchParams.get("endDate") ?? undefined;

    const { data, response } = await financialSummaryServerService.getByCategory(
      { type, accountId, startDate, endDate },
      cookieHeader
    );

    return NextResponse.json(data, { status: response.status || 200 });
  } catch (error: unknown) {
    const status = error instanceof BackendApiError ? error.status : 500;
    const message =
      error instanceof BackendApiError
        ? error.message
        : "Erro ao consultar distribuição por categoria";
    const data = error instanceof BackendApiError ? error.data : null;

    return NextResponse.json({ message, data }, { status });
  }
}
