import { NextResponse } from "next/server";
import {
  authServerService,
  BackendApiError,
} from "@/modules/auth/services/auth.server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { data, response: backendResponse } =
      await authServerService.resetPassword(body);

    return NextResponse.json(data, { status: backendResponse.status || 200 });
  } catch (error: unknown) {
    const status = error instanceof BackendApiError ? error.status : 400;
    const message =
      error instanceof Error ? error.message : "Erro ao redefinir senha";
    const data = error instanceof BackendApiError ? error.data : null;

    return NextResponse.json(
      { message, data },
      { status }
    );
  }
}
