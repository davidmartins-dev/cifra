import { NextResponse } from "next/server";
import {
  financialSummaryServerService,
  BackendApiError,
} from "@/modules/financial-summary/services/financial-summary.server";

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId") ?? undefined;
    const startDate = searchParams.get("startDate") ?? undefined;
    const endDate = searchParams.get("endDate") ?? undefined;

    const { data, response } = await financialSummaryServerService.getOverview(
      { accountId, startDate, endDate },
      cookieHeader
    );

    return NextResponse.json(data, { status: response.status || 200 });
  } catch (error: unknown) {
    const status = error instanceof BackendApiError ? error.status : 500;
    const message =
      error instanceof BackendApiError
        ? error.message
        : "Erro ao consultar resumo financeiro";
    const data = error instanceof BackendApiError ? error.data : null;

    return NextResponse.json({ message, data }, { status });
  }
}
