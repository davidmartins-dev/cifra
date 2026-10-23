import { test, expect } from "@playwright/test";

test.describe("E2E - Fluxo de Recuperação de Senha (Recovery Wizard)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/forgot-password");
  });

  test("deve exibir o formulário inicial de recuperação de senha", async ({ page }) => {
    await expect(page.getByRole("link", { name: /^cifra/i })).toBeVisible();
    await expect(page.getByText("Recuperar senha")).toBeVisible();
    await expect(page.getByLabel(/^e-mail$/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /enviar código/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /voltar para o login/i })).toBeVisible();
  });

  test("deve validar o e-mail no Passo 1 e avançar para o Passo 2 ao solicitar o código", async ({ page }) => {
    // Validação com e-mail inválido
    await page.getByLabel(/^e-mail$/i).fill("formato-invalido");
    await page.getByRole("button", { name: /enviar código/i }).click();
    await expect(page.getByText(/informe um e-mail válido/i)).toBeVisible();

    // Mock do envio do código
    await page.route("**/api/auth/email-verification/send", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Código enviado" }),
      });
    });

    await page.getByLabel(/^e-mail$/i).fill("recuperar@cifra.app");
    await page.getByRole("button", { name: /enviar código/i }).click();

    // Passo 2
    await expect(page.getByText("Verifique seu e-mail")).toBeVisible();
    await expect(page.getByText("recuperar@cifra.app", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /alterar e-mail informado/i })).toBeVisible();
  });

  test("deve executar todo o fluxo de recuperação e redirecionar para o login após concluir redefinição", async ({ page }) => {
    // Mock Passo 1
    await page.route("**/api/auth/email-verification/send", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Código enviado com sucesso" }),
      });
    });

    // Mock Passo 2
    await page.route("**/api/auth/email-verification/verify", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          verified: true,
          message: "Código verificado",
          verificationTicket: "ticket-recuperacao-12345",
        }),
      });
    });

    // Mock Passo 3
    await page.route("**/api/auth/reset-password", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Senha redefinida com sucesso" }),
      });
    });

    // Passo 1: Informar e-mail
    await page.getByLabel(/^e-mail$/i).fill("recuperar@cifra.app");
    await page.getByRole("button", { name: /enviar código/i }).click();

    // Passo 2: Digitar código OTP via native value setter
    await expect(page.getByText("Verifique seu e-mail")).toBeVisible();
    await page.locator("input[data-input-otp='true']").evaluate((el: HTMLInputElement, code: string) => {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      nativeSetter?.call(el, code);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, "654321");

    const continueButton = page.getByRole("button", { name: /^continuar$/i });
    await expect(continueButton).toBeEnabled();
    await continueButton.click();

    // Passo 3: Criar nova senha
    await expect(page.getByText("Criar nova senha")).toBeVisible();

    const newPasswordInput = page.getByLabel(/^nova senha$/i);
    const confirmPasswordInput = page.getByLabel(/confirmar nova senha/i);

    await newPasswordInput.fill("NovaSenhaSegura123!");
    await confirmPasswordInput.fill("NovaSenhaSegura123!");

    const submitButton = page.getByRole("button", { name: /concluir redefinição/i });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // Redireciona para /login
    await expect(page).toHaveURL(/\/login/);
  });
});
