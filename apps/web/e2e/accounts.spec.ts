import { test, expect } from "@playwright/test";

test.describe("E2E - Gestão de Contas Financeiras (/accounts)", () => {
  test.beforeEach(async ({ page }) => {
    // 1. Realiza login com o usuário padrão de desenvolvimento
    await page.goto("/login");
    await page.getByLabel(/^e-mail$/i).fill("admin@cifra.app");
    await page.getByLabel(/^senha$/i).fill("Admin@123456");
    await page.getByRole("button", { name: /^entrar$/i }).click();

    // 2. Aguarda redirecionamento para o dashboard
    await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
  });

  test("deve navegar do Dashboard para a página de Contas e exibir elementos essenciais", async ({
    page,
  }) => {
    // Clica no link "Gerenciar Contas" do Dashboard
    const manageAccountsLink = page.getByRole("link", { name: /gerenciar contas/i });
    await expect(manageAccountsLink).toBeVisible();
    await manageAccountsLink.click();

    await expect(page).toHaveURL(/accounts/);

    // Valida títulos e estrutura da página
    await expect(
      page.getByRole("heading", { name: "Minhas Contas" })
    ).toBeVisible();
    await expect(page.getByText("Saldo Consolidado")).toBeVisible();
    await expect(page.getByText("Total de Contas")).toBeVisible();
    await expect(page.getByTestId("open-create-account-button")).toBeVisible();

    // Valida link de retorno ao Dashboard
    const backLink = page.getByRole("link", { name: /voltar ao dashboard/i });
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL(/dashboard/);
  });

  test("deve validar campos obrigatórios ao tentar criar uma conta", async ({
    page,
  }) => {
    await page.goto("/accounts");
    await expect(
      page.getByRole("heading", { name: "Minhas Contas" })
    ).toBeVisible({ timeout: 10000 });

    // Abre o modal de nova conta
    await page.getByTestId("open-create-account-button").click();
    await expect(page.getByTestId("account-form-dialog")).toBeVisible();
    await expect(page.getByText("Nova Conta Financeira")).toBeVisible();

    // Tenta submeter sem preencher o nome
    await page.getByTestId("account-submit-button").click();
    await expect(page.getByTestId("account-name-error")).toBeVisible();
    await expect(page.getByTestId("account-name-error")).toContainText(
      "O nome da conta é obrigatório"
    );

    // Cancela e fecha o modal
    await page.getByTestId("account-cancel-button").click();
    await expect(page.getByTestId("account-form-dialog")).not.toBeVisible();
  });

  test("deve executar o ciclo completo de CRUD: Criar, Visualizar, Editar e Excluir conta", async ({
    page,
  }) => {
    const uniqueAccountName = `Nubank E2E ${Date.now()}`;
    const updatedAccountName = `${uniqueAccountName} Alterada`;

    await page.goto("/accounts");
    await expect(
      page.getByRole("heading", { name: "Minhas Contas" })
    ).toBeVisible({ timeout: 10000 });

    // 1. Criar nova conta
    await page.getByTestId("open-create-account-button").click();
    await expect(page.getByTestId("account-form-dialog")).toBeVisible();

    await page.getByTestId("account-name-input").fill(uniqueAccountName);
    await page.getByTestId("account-balance-input").fill("2500,50");
    await page.getByTestId("account-submit-button").click();

    // Modal deve fechar e a nova conta deve constar na listagem
    await expect(page.getByTestId("account-form-dialog")).not.toBeVisible();

    const createdCard = page
      .locator('[data-testid="account-card"]')
      .filter({ hasText: uniqueAccountName });

    await expect(createdCard).toBeVisible({ timeout: 10000 });
    await expect(createdCard.getByTestId("account-card-balance")).toContainText(
      "2.500,50"
    );

    // 2. Editar a conta criada
    await createdCard.getByLabel("Opções da conta").click();
    await page.getByRole("menuitem", { name: /editar/i }).click();

    await expect(page.getByText("Editar Conta Financeira")).toBeVisible();
    await expect(page.getByTestId("account-name-input")).toHaveValue(
      uniqueAccountName
    );

    await page.getByTestId("account-name-input").fill(updatedAccountName);
    await page.getByTestId("account-submit-button").click();

    // Modal fecha e card exibe o novo nome
    await expect(page.getByTestId("account-form-dialog")).not.toBeVisible();

    const updatedCard = page
      .locator('[data-testid="account-card"]')
      .filter({ hasText: updatedAccountName });

    await expect(updatedCard).toBeVisible({ timeout: 10000 });

    // 3. Excluir a conta criada
    await updatedCard.getByLabel("Opções da conta").click();
    await page.getByRole("menuitem", { name: /excluir/i }).click();

    // Modal de confirmação
    await expect(page.getByTestId("delete-account-dialog")).toBeVisible();
    await page.getByTestId("confirm-delete-account-button").click();

    // Modal fecha e card não deve mais existir
    await expect(page.getByTestId("delete-account-dialog")).not.toBeVisible();
    await expect(updatedCard).not.toBeVisible({ timeout: 10000 });
  });
});
