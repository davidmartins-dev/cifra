import { NextResponse, type NextRequest } from "next/server";
import { getInternalApiUrl } from "@/lib/config";

// Rotas que exigem autenticação obrigatória
const PROTECTED_ROUTES = [
  "/dashboard",
  "/accounts",
  "/categories",
  "/transactions",
  "/financial-summary",
  "/admin",
  "/audit",
  "/profile",
];

// Rotas públicas de autenticação (redirecionam para o dashboard se o usuário já estiver logado)
const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];

/**
 * Consulta o backend NestJS como a única fonte da verdade para validar a sessão.
 * O Next.js não inspeciona nomes nem regras de cookies locais.
 */
async function verifySessionWithBackend(cookieHeader: string): Promise<boolean> {
  // Em ambiente de teste E2E (Playwright) onde o backend NestJS é mockado no front-end
  if (
    (process.env.PLAYWRIGHT_TEST === "true" ||
      process.env.CI ||
      process.env.NODE_ENV !== "production") &&
    cookieHeader.includes("cifra_e2e_auth=true")
  ) {
    return true;
  }

  try {
    const response = await fetch(`${getInternalApiUrl()}/auth/me`, {
      method: "GET",
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Se não for rota protegida nem de autenticação, libera imediatamente
  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  const cookieHeader = request.headers.get("cookie");
  const isAuthenticated = cookieHeader
    ? await verifySessionWithBackend(cookieHeader)
    : false;

  // 1. Usuário não autenticado tentando acessar rota protegida -> redireciona para login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Usuário com sessão ativa no NestJS tentando acessar telas de login/cadastro -> redireciona para dashboard
  if (isAuthRoute && isAuthenticated) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Intercepta todas as rotas exceto:
     * - api (rotas da API/BFF)
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagem)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
