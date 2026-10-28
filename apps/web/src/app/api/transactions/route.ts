import { NextResponse } from "next/server";
import {
  transactionsServerService,
  BackendApiError,
} from "@/modules/transactions/services/transactions.server";
import { TransactionType } from "@/modules/transactions/types/transaction";

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") ?? undefined;
    const endDate = searchParams.get("endDate") ?? undefined;
    const typeParam = searchParams.get("type");
    const type =
      typeParam === TransactionType.INCOME || typeParam === TransactionType.EXPENSE
        ? typeParam
        : undefined;
    const categoryId = searchParams.get("categoryId") ?? undefined;
    const accountId = searchParams.get("accountId") ?? undefined;
    const pageParam = searchParams.get("page");
    const page = pageParam ? Number(pageParam) : undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : undefined;

    const { data, response } = await transactionsServerService.list(
      { startDate, endDate, type, categoryId, accountId, page, limit },
      cookieHeader
    );
    return NextResponse.json(data, { status: response.status || 200 });
  } catch (error: unknown) {
    const status = error instanceof BackendApiError ? error.status : 500;
    const message =
      error instanceof BackendApiError
        ? error.message
        : "Erro ao consultar transações financeiras";
    const data = error instanceof BackendApiError ? error.data : null;

    return NextResponse.json({ message, data }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { data, response } = await transactionsServerService.create(
      body,
      cookieHeader
    );
    return NextResponse.json(data, { status: response.status || 201 });
  } catch (error: unknown) {
    const status = error instanceof BackendApiError ? error.status : 500;
    const message =
      error instanceof BackendApiError
        ? error.message
        : "Erro ao criar transação financeira";
    const data = error instanceof BackendApiError ? error.data : null;

    return NextResponse.json({ message, data }, { status });
  }
}
