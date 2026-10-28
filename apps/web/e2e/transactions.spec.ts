import { test, expect } from "@playwright/test";

interface MockTransaction {
  id: string;
  userId: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  date: string;
  categoryId: string;
  accountId?: string | null;
  category?: {
    id: string;
    name: string;
    type: "INCOME" | "EXPENSE";
  };
  account?: {
    id: string;
    name: string;
    type: string;
    balance: number;
  } | null;
  createdAt: string;
  updatedAt: string;
}

test.describe("E2E - Gestão de Transações Financeiras (/transactions)", () => {
  let mockTransactions: MockTransaction[] = [];

  const mockCategories: Array<{
    id: string;
    name: string;
    type: "INCOME" | "EXPENSE";
  }> = [
    {
      id: "cat-1",
      name: "Salário",
      type: "INCOME",
    },
    {
      id: "cat-2",
      name: "Alimentação",
      type: "EXPENSE",
    },
  ];

  const mockAccounts = [
    {
      id: "acc-1",
      name: "Conta Nubank",
      type: "CHECKING",
      balance: 5000,
    },
  ];

  test.beforeEach(async ({ page, context }) => {
    mockTransactions = [
      {
        id: "tx-initial-1",
        userId: "user-uuid-123",
        description: "Salário Mensal",
        amount: 5000,
        type: "INCOME",
        date: new Date().toISOString(),
        categoryId: "cat-1",
        accountId: "acc-1",
        category: mockCategories[0],
        account: mockAccounts[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "tx-initial-2",
        userId: "user-uuid-123",
        description: "Supermercado Semanal",
        amount: 350.5,
        type: "EXPENSE",
        date: new Date().toISOString(),
        categoryId: "cat-2",
        accountId: "acc-1",
        category: mockCategories[1],
        account: mockAccounts[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // 1. Mock de autenticação
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

    // 2. Mock de categorias
    await page.route("**/api/categories**", async (route) => {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockCategories),
      });
    });

    // 3. Mock de contas
    await page.route("**/api/accounts**", async (route) => {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockAccounts),
      });
    });

    // 4. Mock da API de transações (CRUD completo)
    await page.route("**/api/transactions**", async (route) => {
      const method = route.request().method();
      const url = new URL(route.request().url());
      const match = url.pathname.match(/\/api\/transactions\/([^/?#]+)/);
      const transactionId = match ? match[1] : null;

      if (method === "GET") {
        if (transactionId) {
          const tx = mockTransactions.find((t) => t.id === transactionId);
          if (!tx) {
            return route.fulfill({
              status: 404,
              contentType: "application/json",
              body: JSON.stringify({ message: "Transação não encontrada" }),
            });
          }
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(tx),
          });
        }

        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockTransactions),
        });
      }

      if (method === "POST") {
        const body = route.request().postDataJSON();
        const category = mockCategories.find((c) => c.id === body.categoryId);
        const account = mockAccounts.find((a) => a.id === body.accountId) ?? null;

        const newTx: MockTransaction = {
          id: `tx-${Date.now()}`,
          userId: "user-uuid-123",
          description: body.description,
          amount: Number(body.amount),
          type: body.type,
          date: body.date,
          categoryId: body.categoryId,
          accountId: body.accountId ?? null,
          category,
          account,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        mockTransactions = [newTx, ...mockTransactions];
        return route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(newTx),
        });
      }

      if (method === "PATCH") {
        const body = route.request().postDataJSON();
        const index = mockTransactions.findIndex((t) => t.id === transactionId);
        if (index === -1) {
          return route.fulfill({
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({ message: "Transação não encontrada" }),
          });
        }

        mockTransactions[index] = {
          ...mockTransactions[index],
          ...body,
          updatedAt: new Date().toISOString(),
        };
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockTransactions[index]),
        });
      }

      if (method === "DELETE") {
        mockTransactions = mockTransactions.filter((t) => t.id !== transactionId);
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: "Transação removida com sucesso" }),
        });
      }

      return route.fallback();
    });

    // 5. Login
    await page.goto("/login");
    await page.getByLabel(/^e-mail$/i).fill("admin@cifra.app");
    await page.getByLabel(/^senha$/i).fill("Admin@123456");
    await page.getByRole("button", { name: /^entrar$/i }).click();

    await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
  });

  test("deve navegar do Dashboard para a página de Transações e exibir métricas", async ({
    page,
  }) => {
    // Clica no atalho "Gerenciar Transações" no Dashboard
    const manageTransactionsLink = page.getByRole("link", {
      name: /gerenciar transações/i,
    });
    await expect(manageTransactionsLink).toBeVisible();
    await manageTransactionsLink.click();

    await expect(page).toHaveURL(/transactions/);

    // Valida estrutura principal e cards de métricas
    await expect(
      page.getByRole("heading", { name: "Minhas Transações" })
    ).toBeVisible();
    await expect(page.getByText("Total de Receitas")).toBeVisible();
    await expect(page.getByText("Total de Despesas")).toBeVisible();
    await expect(page.getByText("Saldo do Período")).toBeVisible();
    await expect(page.getByTestId("open-create-transaction-button")).toBeVisible();

    // Link de voltar ao Dashboard
    const backLink = page.getByRole("link", { name: /voltar ao dashboard/i });
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL(/dashboard/);
  });

  test("deve validar campos obrigatórios ao tentar cadastrar transação vazia", async ({
    page,
  }) => {
    await page.goto("/transactions");
    await expect(
      page.getByRole("heading", { name: "Minhas Transações" })
    ).toBeVisible({ timeout: 10000 });

    // Abre modal de nova transação
    await page.getByTestId("open-create-transaction-button").click();
    await expect(page.getByTestId("transaction-form-dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nova Transação" })).toBeVisible();

    // Tenta submeter sem preencher descrição nem valor
    await page.getByTestId("transaction-submit-button").click();
    await expect(page.getByTestId("transaction-description-error")).toBeVisible();
    await expect(page.getByTestId("transaction-description-error")).toContainText(
      "A descrição da transação é obrigatória"
    );

    // Fecha o modal
    await page.getByTestId("transaction-cancel-button").click();
    await expect(page.getByTestId("transaction-form-dialog")).not.toBeVisible();
  });

  test("deve executar o ciclo completo de CRUD: Criar, Filtrar, Editar e Excluir transação", async ({
    page,
  }) => {
    const uniqueTxDesc = `Almoço Executivo ${Date.now()}`;
    const updatedTxDesc = `${uniqueTxDesc} Alterado`;

    await page.goto("/transactions");
    await expect(
      page.getByRole("heading", { name: "Minhas Transações" })
    ).toBeVisible({ timeout: 10000 });

    // 1. Criar transação de Despesa
    await page.getByTestId("open-create-transaction-button").click();
    await expect(page.getByTestId("transaction-form-dialog")).toBeVisible();

    // Seleciona Despesa
    await page.getByTestId("transaction-type-expense-btn").click();
    await page.getByTestId("transaction-description-input").fill(uniqueTxDesc);
    await page.getByTestId("transaction-amount-input").fill("85,50");

    // Seleciona Categoria "Alimentação"
    await page.getByTestId("transaction-category-select").click();
    await page.getByTestId("transaction-category-option-cat-2").click();

    // Submete
    await page.getByTestId("transaction-submit-button").click();

    // Modal fecha e nova transação aparece
    await expect(page.getByTestId("transaction-form-dialog")).not.toBeVisible();

    const createdCard = page
      .locator('[data-testid="transaction-card"]')
      .filter({ hasText: uniqueTxDesc });

    await expect(createdCard).toBeVisible({ timeout: 10000 });
    await expect(createdCard.getByTestId("transaction-card-amount")).toContainText("85,50");

    // 2. Testar filtros (Todas, Receitas, Despesas)
    await page.getByTestId("filter-income-button").click();
    await expect(createdCard).not.toBeVisible();

    await page.getByTestId("filter-expense-button").click();
    await expect(createdCard).toBeVisible();

    await page.getByTestId("filter-all-button").click();
    await expect(createdCard).toBeVisible();

    // 3. Editar transação
    await createdCard.getByRole("button", { name: /opções da transação/i }).click();
    await page.getByRole("menuitem", { name: /editar/i }).click();

    await expect(page.getByRole("heading", { name: "Editar Transação" })).toBeVisible();
    await expect(page.getByTestId("transaction-description-input")).toHaveValue(uniqueTxDesc);

    await page.getByTestId("transaction-description-input").fill(updatedTxDesc);
    await page.getByTestId("transaction-submit-button").click();

    await expect(page.getByTestId("transaction-form-dialog")).not.toBeVisible();

    const updatedCard = page
      .locator('[data-testid="transaction-card"]')
      .filter({ hasText: updatedTxDesc });
    await expect(updatedCard).toBeVisible({ timeout: 10000 });

    // 4. Excluir transação
    await updatedCard.getByRole("button", { name: /opções da transação/i }).click();
    await page.getByRole("menuitem", { name: /excluir/i }).click();

    // Modal de confirmação
    const deleteDialog = page.getByTestId("delete-transaction-dialog");
    await expect(deleteDialog).toBeVisible();
    await expect(deleteDialog.getByText(updatedTxDesc)).toBeVisible();
    await page.getByTestId("confirm-delete-transaction-button").click();

    await expect(deleteDialog).not.toBeVisible();
    await expect(updatedCard).not.toBeVisible({ timeout: 10000 });
  });
});
