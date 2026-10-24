import { NextResponse } from "next/server";
import {
  authServerService,
  BackendApiError,
  forwardCookiesToClient,
} from "@/modules/auth/services/auth.server";

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie");

    if (!cookieHeader) {
      return NextResponse.json(
        { message: "Não autorizado" },
        { status: 401 }
      );
    }

    const { data, response: backendResponse } = await authServerService.getMe(
      cookieHeader
    );

    const clientResponse = NextResponse.json(data, {
      status: backendResponse.status || 200,
    });

    forwardCookiesToClient(backendResponse, clientResponse);

    return clientResponse;
  } catch (error: unknown) {
    const status = error instanceof BackendApiError ? error.status : 401;
    const message =
      error instanceof Error ? error.message : "Sessão inválida ou expirada";

    return NextResponse.json({ message }, { status });
  }
}
