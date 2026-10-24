import { test, expect } from "@playwright/test";

interface MockAccount {
  id: string;
  userId: string;
  name: string;
  type: string;
  balance: number;
  color?: string;
  includeInTotal: boolean;
  createdAt: string;
  updatedAt: string;
}

test.describe("E2E - Gestão de Contas Financeiras (/accounts)", () => {
  let mockAccounts: MockAccount[] = [];

  test.beforeEach(async ({ page, context }) => {
    // 1. Estado inicial isolado por teste
    mockAccounts = [
      {
        id: "acc-initial-1",
        userId: "user-uuid-123",
        name: "Conta Corrente Principal",
        type: "CHECKING",
        balance: 1000,
        color: "#10b981",
        includeInTotal: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // 2. Mock de autenticação (BFF login e cookie de sessão E2E)
    await page.route("**/api/auth/login", async (route) => {
      await context.addCookies([
        {
          name: "cifra_e2e_auth",
          value: "true",
          domain: "localhost",
          path: "/",
        },
      ]);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "Set-Cookie": "cifra_e2e_auth=true; Path=/; HttpOnly",
        },
        body: JSON.stringify({
          user: {
            id: "user-uuid-123",
            email: "admin@cifra.app",
            name: "Administrador Cifra",
          },
          tokens: {
            accessToken: "mock-access-token",
            refreshToken: "mock-refresh-token",
          },
        }),
      });
    });

    // 3. Mock da API de contas financeiras (CRUD completo simulado no Playwright)
    await page.route("**/api/accounts**", async (route) => {
      const method = route.request().method();
      const url = new URL(route.request().url());
      const match = url.pathname.match(/\/api\/accounts\/([^/?#]+)/);
      const accountId = match ? match[1] : null;

      if (method === "GET") {
        if (accountId) {
          const account = mockAccounts.find((a) => a.id === accountId);
          if (!account) {
            return route.fulfill({
              status: 404,
              contentType: "application/json",
              body: JSON.stringify({ message: "Conta não encontrada" }),
            });
          }
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(account),
          });
        }

        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockAccounts),
        });
      }

      if (method === "POST") {
        const body = route.request().postDataJSON();
        const newAccount: MockAccount = {
          id: `acc-${Date.now()}`,
          userId: "user-uuid-123",
          name: body.name,
          type: body.type || "CHECKING",
          balance: Number(body.balance) || 0,
          color: body.color || "#10b981",
          includeInTotal: body.includeInTotal ?? true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockAccounts = [newAccount, ...mockAccounts];
        return route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(newAccount),
        });
      }

      if (method === "PATCH") {
        const body = route.request().postDataJSON();
        const index = mockAccounts.findIndex((a) => a.id === accountId);
        if (index === -1) {
          return route.fulfill({
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({ message: "Conta não encontrada" }),
          });
        }
        mockAccounts[index] = {
          ...mockAccounts[index],
          ...body,
          updatedAt: new Date().toISOString(),
        };
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockAccounts[index]),
        });
      }

      if (method === "DELETE") {
        mockAccounts = mockAccounts.filter((a) => a.id !== accountId);
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: "Conta excluída com sucesso" }),
        });
      }

      return route.fallback();
    });

    // 4. Realiza login e aguarda redirecionamento para o dashboard
    await page.goto("/login");
    await page.getByLabel(/^e-mail$/i).fill("admin@cifra.app");
    await page.getByLabel(/^senha$/i).fill("Admin@123456");
    await page.getByRole("button", { name: /^entrar$/i }).click();

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
