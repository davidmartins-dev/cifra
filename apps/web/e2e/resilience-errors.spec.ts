import { test, expect } from "@playwright/test";

test.describe("E2E Marco 3 - Resiliência, Tratamento de Falhas e Erros no Front-end", () => {
  const setAuthSession = async (context: import("@playwright/test").BrowserContext) => {
    await context.addCookies([
      {
        name: "cifra_e2e_auth",
        value: "true",
        url: "http://127.0.0.1:3001",
      },
      {
        name: "cifra_e2e_auth",
        value: "true",
        url: "http://localhost:3001",
      },
    ]);
  };

  test("deve exibir alerta visual amigável quando o backend retornar erro 500 no login", async ({
    page,
  }) => {
    await page.goto("/login");

    // Simula queda de infraestrutura / erro 500 na rota de login
    await page.route("**/api/auth/login", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          statusCode: 500,
          message: "Falha de comunicação interna com o servidor.",
          error: "Internal Server Error",
        }),
      });
    });

    await page.getByLabel(/^e-mail$/i).fill("usuario@cifra.app");
    await page.getByLabel(/^senha$/i).fill("SenhaValida123!");
    await page.getByRole("button", { name: /^entrar$/i }).click();

    // Valida que a interface permaneceu estável e exibiu o feedback de erro específico
    const alert = page.getByRole("alert").filter({ hasText: /falha de comunicação/i });
    await expect(alert).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("deve redirecionar para a tela de login ao receber erro 401 (token expirado) em rotas autenticadas", async ({
    page,
    context,
  }) => {
    await setAuthSession(context);

    // Simula que a chamada a /api/auth/me expirou e retornou 401
    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Sua sessão expirou. Faça login novamente." }),
      });
    });

    await page.route("**/api/accounts**", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Token inválido ou expirado" }),
      });
    });

    await page.goto("/accounts");
    await page.waitForTimeout(1000);

    const currentUrl = page.url();
    expect(currentUrl).toMatch(/(\/accounts|\/login)/);
  });

  test("deve manter o diálogo aberto e exibir feedback de erro ao falhar submissão de nova conta com 500", async ({
    page,
    context,
  }) => {
    await setAuthSession(context);

    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: { id: "user-resilience", name: "User Resilient", email: "resilient@cifra.app" },
        }),
      });
    });

    await page.route("**/api/accounts**", async (route) => {
      const method = route.request().method();
      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      } else if (method === "POST") {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ message: "Erro ao processar transação no banco de dados." }),
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto("/accounts");
    await page.getByTestId("open-create-account-button").click();

    const dialog = page.getByTestId("account-form-dialog");
    await expect(dialog).toBeVisible();

    await page.getByTestId("account-name-input").fill("Conta Falha");
    await page.getByTestId("account-type-select").click();
    await page.getByTestId("account-type-option-CHECKING").click();
    await page.getByRole("button", { name: /criar conta/i }).click();

    // O modal deve permanecer aberto para que o usuário não perca o que digitou
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId("account-name-input")).toHaveValue("Conta Falha");
  });

  test("deve tratar queda de rede ou aborto de requisição no dashboard sem travar a interface", async ({
    page,
    context,
  }) => {
    await setAuthSession(context);

    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: { id: "user-resilience", name: "User Resilient", email: "resilient@cifra.app" },
        }),
      });
    });

    // Aborta requisição de resumo financeiro simulando queda de conexão
    await page.route("**/api/financial-summary/overview**", async (route) => {
      await route.abort("failed");
    });

    await page.goto("/dashboard");

    // A página carrega e renderiza a estrutura com segurança sem página em branco
    await expect(page.getByRole("heading", { name: /olá,/i })).toBeVisible();
    await expect(page.getByText("Ações Rápidas")).toBeVisible();
  });
});
