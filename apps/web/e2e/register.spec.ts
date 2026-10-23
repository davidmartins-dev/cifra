import { test, expect } from "@playwright/test";

test.describe("E2E - Fluxo de Cadastro (Register Wizard)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register");
  });

  test("deve exibir o Passo 1 do wizard com campo de e-mail e botão continuar", async ({ page }) => {
    await expect(page.getByRole("link", { name: /^cifra/i })).toBeVisible();
    await expect(page.getByText("Crie sua conta")).toBeVisible();
    await expect(page.getByLabel(/^e-mail$/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^continuar$/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /^entrar$/i })).toBeVisible();
  });

  test("deve validar o e-mail no Passo 1 e avançar para o Passo 2 ao enviar o código", async ({ page }) => {
    // Validação com e-mail inválido
    await page.getByLabel(/^e-mail$/i).fill("invalido");
    await page.getByRole("button", { name: /^continuar$/i }).click();
    await expect(page.getByText(/informe um e-mail válido/i)).toBeVisible();

    // Mock do envio do código
    await page.route("**/api/auth/email-verification/send", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Código enviado com sucesso" }),
      });
    });

    await page.getByLabel(/^e-mail$/i).fill("novo@cifra.app");
    await page.getByRole("button", { name: /^continuar$/i }).click();

    // Passo 2 visível
    await expect(page.getByText("Verifique seu e-mail")).toBeVisible();
    await expect(page.getByText("novo@cifra.app", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /alterar e-mail informado/i })).toBeVisible();
  });

  test("deve permitir retornar ao Passo 1 ao clicar em alterar e-mail", async ({ page }) => {
    await page.route("**/api/auth/email-verification/send", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Código enviado com sucesso" }),
      });
    });

    await page.getByLabel(/^e-mail$/i).fill("novo@cifra.app");
    await page.getByRole("button", { name: /^continuar$/i }).click();

    await expect(page.getByText("Verifique seu e-mail")).toBeVisible();

    // Clica em alterar e-mail
    await page.getByRole("button", { name: /alterar e-mail informado/i }).click();

    await expect(page.getByText("Crie sua conta")).toBeVisible();
    await expect(page.getByLabel(/^e-mail$/i)).toHaveValue("novo@cifra.app");
  });

  test("deve completar todo o fluxo de cadastro até o redirecionamento ao dashboard", async ({ page }) => {
    // Mock Step 1
    await page.route("**/api/auth/email-verification/send", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Código enviado com sucesso" }),
      });
    });

    // Mock Step 2
    await page.route("**/api/auth/email-verification/verify", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          verified: true,
          message: "Código verificado com sucesso",
          verificationTicket: "mock-verification-ticket-12345",
        }),
      });
    });

    // Mock Step 3
    await page.route("**/api/auth/register", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "user-new-id",
            name: "Novo Usuário",
            email: "novo@cifra.app",
          },
          tokens: {
            accessToken: "mock-new-access-token",
            refreshToken: "mock-new-refresh-token",
          },
        }),
      });
    });

    // Passo 1: Informar e-mail
    await page.getByLabel(/^e-mail$/i).fill("novo@cifra.app");
    await page.getByRole("button", { name: /^continuar$/i }).click();

    // Passo 2: Digitar código OTP via native value setter
    await expect(page.getByText("Verifique seu e-mail")).toBeVisible();
    await page.locator("input[data-input-otp='true']").evaluate((el: HTMLInputElement, code: string) => {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      nativeSetter?.call(el, code);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, "123456");

    const continueButton = page.getByRole("button", { name: /^continuar$/i });
    await expect(continueButton).toBeEnabled();
    await continueButton.click();

    // Passo 3: Configurar Perfil e Senha
    await expect(page.getByText("Configure seu perfil")).toBeVisible();

    await page.getByLabel(/nome completo/i).fill("Novo Usuário");

    const passwordInput = page.getByLabel(/^senha$/i);
    const confirmPasswordInput = page.getByLabel(/confirmar senha/i);

    // Indicadores visuais de requisitos de senha
    await passwordInput.fill("SenhaForte123!");
    await confirmPasswordInput.fill("SenhaForte123!");

    await expect(page.getByText(/senhas coincidem/i)).toBeVisible();

    // Submete cadastro
    const finishButton = page.getByRole("button", { name: /finalizar e acessar o cifra/i });
    await expect(finishButton).toBeEnabled();
    await finishButton.click();

    // Redireciona para dashboard (ou login se sem sessão no Nest)
    await expect(page).toHaveURL(/(\/dashboard|\/login\?from=%2Fdashboard)/);
  });
});
