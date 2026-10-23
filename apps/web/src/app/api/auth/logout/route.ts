import { NextResponse } from "next/server";
import {
  authServerService,
  BackendApiError,
  forwardCookiesToClient,
} from "@/modules/auth/services/auth.server";

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie");

    const { data, response: backendResponse } = await authServerService.logout(
      cookieHeader
    );

    const clientResponse = NextResponse.json(data, {
      status: backendResponse.status || 200,
    });

    // Repassa o cabeçalho emitido pelo NestJS (que remove ou invalida o cookie)
    forwardCookiesToClient(backendResponse, clientResponse);

    return clientResponse;
  } catch (error: unknown) {
    const status = error instanceof BackendApiError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Erro ao encerrar sessão";

    return NextResponse.json({ message }, { status });
  }
}
