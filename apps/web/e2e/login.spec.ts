import { test, expect } from "@playwright/test";

test.describe("E2E - Fluxo de Autenticação / Login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("deve exibir todos os elementos visuais essenciais da página de login", async ({ page }) => {
    await expect(page.getByRole("link", { name: /^cifra/i })).toBeVisible();
    await expect(page.getByText("Acesse sua conta")).toBeVisible();
    await expect(page.getByLabel(/^e-mail$/i)).toBeVisible();
    await expect(page.getByLabel(/^senha$/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^entrar$/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /esqueci minha senha/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /criar conta/i })).toBeVisible();
  });

  test("deve validar campos obrigatórios e formato de e-mail inválido", async ({ page }) => {
    // Tenta submeter sem preencher
    await page.getByRole("button", { name: /^entrar$/i }).click();
    await expect(page.getByText(/por favor, informe seu e-mail/i)).toBeVisible();
    await expect(page.getByText(/por favor, informe sua senha/i)).toBeVisible();

    // Digita formato inválido de e-mail
    await page.getByLabel(/^e-mail$/i).fill("email-invalido");
    await page.getByRole("button", { name: /^entrar$/i }).click();
    await expect(page.getByText(/informe um e-mail válido/i)).toBeVisible();
  });

  test("deve alternar a visibilidade da senha ao clicar no botão de alternância", async ({ page }) => {
    const passwordInput = page.getByLabel(/^senha$/i);
    const toggleButton = page.getByRole("button", { name: /ver senha/i });

    await expect(passwordInput).toHaveAttribute("type", "password");
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute("type", "text");

    const hideButton = page.getByRole("button", { name: /ocultar senha/i });
    await hideButton.click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("deve exibir mensagem de erro visual quando a autenticação falhar com 401", async ({ page }) => {
    await page.route("**/api/auth/login", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          statusCode: 401,
          message: "Credenciais inválidas. Verifique seu e-mail e senha.",
          error: "Unauthorized",
        }),
      });
    });

    await page.getByLabel(/^e-mail$/i).fill("usuario@incorreto.com");
    await page.getByLabel(/^senha$/i).fill("SenhaErrada123!");
    await page.getByRole("button", { name: /^entrar$/i }).click();

    const alert = page.getByRole("alert").filter({ hasText: /credenciais inválidas/i });
    await expect(alert).toBeVisible();
  });

  test("deve realizar login com sucesso e redirecionar para o dashboard", async ({ page }) => {
    await page.route("**/api/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "user-uuid-123",
            email: "david@cifra.app",
            name: "David Martins",
          },
          tokens: {
            accessToken: "mock-access-token",
            refreshToken: "mock-refresh-token",
          },
        }),
      });
    });

    await page.getByLabel(/^e-mail$/i).fill("david@cifra.app");
    await page.getByLabel(/^senha$/i).fill("SenhaForte123!");
    await page.getByRole("button", { name: /^entrar$/i }).click();

    await expect(page).toHaveURL(/(\/dashboard|\/login\?from=%2Fdashboard)/);
  });

  test("deve navegar para a tela de recuperação de senha e de cadastro através dos links", async ({ page }) => {
    await page.getByRole("link", { name: /esqueci minha senha/i }).click();
    await expect(page).toHaveURL(/\/forgot-password/);

    await page.goto("/login");
    await page.getByRole("link", { name: /criar conta/i }).click();
    await expect(page).toHaveURL(/\/register/);
  });
});
