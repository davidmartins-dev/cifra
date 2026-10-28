import { NextResponse } from "next/server";
import {
  transactionsServerService,
  BackendApiError,
} from "@/modules/transactions/services/transactions.server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const { data, response } = await transactionsServerService.getById(
      id,
      cookieHeader
    );
    return NextResponse.json(data, { status: response.status || 200 });
  } catch (error: unknown) {
    const status = error instanceof BackendApiError ? error.status : 500;
    const message =
      error instanceof BackendApiError
        ? error.message
        : "Erro ao buscar transação financeira";
    const data = error instanceof BackendApiError ? error.data : null;

    return NextResponse.json({ message, data }, { status });
  }
}

export async function PATCH(request: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { data, response } = await transactionsServerService.update(
      id,
      body,
      cookieHeader
    );
    return NextResponse.json(data, { status: response.status || 200 });
  } catch (error: unknown) {
    const status = error instanceof BackendApiError ? error.status : 500;
    const message =
      error instanceof BackendApiError
        ? error.message
        : "Erro ao atualizar transação financeira";
    const data = error instanceof BackendApiError ? error.data : null;

    return NextResponse.json({ message, data }, { status });
  }
}

export async function DELETE(request: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const { data, response } = await transactionsServerService.delete(
      id,
      cookieHeader
    );
    return NextResponse.json(data, { status: response.status || 200 });
  } catch (error: unknown) {
    const status = error instanceof BackendApiError ? error.status : 500;
    const message =
      error instanceof BackendApiError
        ? error.message
        : "Erro ao excluir transação financeira";
    const data = error instanceof BackendApiError ? error.data : null;

    return NextResponse.json({ message, data }, { status });
  }
}
