import { NextResponse } from "next/server";
import {
  authServerService,
  BackendApiError,
  forwardCookiesToClient,
} from "@/modules/auth/services/auth.server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { data, response: backendResponse } = await authServerService.register(body);

    const clientResponse = NextResponse.json(data, {
      status: backendResponse.status || 201,
    });

    forwardCookiesToClient(backendResponse, clientResponse);

    return clientResponse;
  } catch (error: unknown) {
    const status = error instanceof BackendApiError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Erro interno ao processar cadastro";
    const data = error instanceof BackendApiError ? error.data : null;

    return NextResponse.json(
      { message, data },
      { status }
    );
  }
}
