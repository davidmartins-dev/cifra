import { NextResponse } from "next/server";
import {
  categoriesServerService,
  BackendApiError,
} from "@/modules/categories/services/categories.server";
import { CategoryType } from "@/modules/categories/types/category";

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");
    const type =
      typeParam === CategoryType.INCOME || typeParam === CategoryType.EXPENSE
        ? typeParam
        : undefined;

    const { data, response } = await categoriesServerService.list(type, cookieHeader);
    return NextResponse.json(data, { status: response.status || 200 });
  } catch (error: unknown) {
    const status = error instanceof BackendApiError ? error.status : 500;
    const message =
      error instanceof BackendApiError
        ? error.message
        : "Erro ao consultar categorias";
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
    const { data, response } = await categoriesServerService.create(body, cookieHeader);
    return NextResponse.json(data, { status: response.status || 201 });
  } catch (error: unknown) {
    const status = error instanceof BackendApiError ? error.status : 500;
    const message =
      error instanceof BackendApiError
        ? error.message
        : "Erro ao criar categoria";
    const data = error instanceof BackendApiError ? error.data : null;

    return NextResponse.json({ message, data }, { status });
  }
}
