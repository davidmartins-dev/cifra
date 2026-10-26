import { test, expect } from "@playwright/test";

interface MockCategory {
  id: string;
  userId: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  createdAt: string;
  updatedAt: string;
}

test.describe("E2E - Gestão de Categorias Financeiras (/categories)", () => {
  let mockCategories: MockCategory[] = [];

  test.beforeEach(async ({ page, context }) => {
    // 1. Estado inicial isolado por teste
    mockCategories = [
      {
        id: "cat-initial-1",
        userId: "user-uuid-123",
        name: "Salário",
        type: "INCOME",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "cat-initial-2",
        userId: "user-uuid-123",
        name: "Alimentação",
        type: "EXPENSE",
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

    // 3. Mock da API de categorias (CRUD completo simulado no Playwright)
    await page.route("**/api/categories**", async (route) => {
      const method = route.request().method();
      const url = new URL(route.request().url());
      const match = url.pathname.match(/\/api\/categories\/([^/?#]+)/);
      const categoryId = match ? match[1] : null;

      if (method === "GET") {
        if (categoryId) {
          const category = mockCategories.find((c) => c.id === categoryId);
          if (!category) {
            return route.fulfill({
              status: 404,
              contentType: "application/json",
              body: JSON.stringify({ message: "Categoria não encontrada" }),
            });
          }
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(category),
          });
        }

        const typeFilter = url.searchParams.get("type");
        const list = typeFilter
          ? mockCategories.filter((c) => c.type === typeFilter)
          : mockCategories;

        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(list),
        });
      }

      if (method === "POST") {
        const body = route.request().postDataJSON();
        const newCategory: MockCategory = {
          id: `cat-${Date.now()}`,
          userId: "user-uuid-123",
          name: body.name,
          type: body.type,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockCategories = [newCategory, ...mockCategories];
        return route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(newCategory),
        });
      }

      if (method === "PATCH") {
        const body = route.request().postDataJSON();
        const index = mockCategories.findIndex((c) => c.id === categoryId);
        if (index === -1) {
          return route.fulfill({
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({ message: "Categoria não encontrada" }),
          });
        }
        mockCategories[index] = {
          ...mockCategories[index],
          ...body,
          updatedAt: new Date().toISOString(),
        };
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockCategories[index]),
        });
      }

      if (method === "DELETE") {
        mockCategories = mockCategories.filter((c) => c.id !== categoryId);
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: "Categoria removida com sucesso" }),
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

  test("deve navegar do Dashboard para a página de Categorias e exibir métricas e elementos essenciais", async ({
    page,
  }) => {
    // Clica no link "Gerenciar Categorias" do Dashboard
    const manageCategoriesLink = page.getByRole("link", { name: /gerenciar categorias/i });
    await expect(manageCategoriesLink).toBeVisible();
    await manageCategoriesLink.click();

    await expect(page).toHaveURL(/categories/);

    // Valida títulos e estrutura da página
    await expect(
      page.getByRole("heading", { name: "Minhas Categorias" })
    ).toBeVisible();
    await expect(page.getByText("Total de Categorias")).toBeVisible();
    await expect(page.getByTestId("total-categories-count")).toHaveText("2");
    await expect(page.getByTestId("income-categories-count")).toHaveText("1");
    await expect(page.getByTestId("expense-categories-count")).toHaveText("1");
    await expect(page.getByTestId("open-create-category-button")).toBeVisible();

    // Valida link de retorno ao Dashboard
    const backLink = page.getByRole("link", { name: /voltar ao dashboard/i });
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL(/dashboard/);
  });

  test("deve validar campos obrigatórios ao tentar submeter categoria sem dados", async ({
    page,
  }) => {
    await page.goto("/categories");
    await expect(
      page.getByRole("heading", { name: "Minhas Categorias" })
    ).toBeVisible({ timeout: 10000 });

    // Abre o modal de nova categoria
    await page.getByTestId("open-create-category-button").click();
    await expect(page.getByTestId("category-form-dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nova Categoria" })).toBeVisible();

    // Tenta submeter sem preencher nome e tipo
    await page.getByTestId("category-submit-button").click();
    await expect(page.getByTestId("category-name-error")).toBeVisible();
    await expect(page.getByTestId("category-name-error")).toContainText(
      "O nome da categoria é obrigatório"
    );

    // Cancela e fecha o modal
    await page.getByTestId("category-cancel-button").click();
    await expect(page.getByTestId("category-form-dialog")).not.toBeVisible();
  });

  test("deve executar o ciclo completo de CRUD: Criar, Filtrar, Editar e Excluir categoria", async ({
    page,
  }) => {
    const uniqueCategoryName = `Investimentos E2E ${Date.now()}`;
    const updatedCategoryName = `${uniqueCategoryName} Alterada`;

    await page.goto("/categories");
    await expect(
      page.getByRole("heading", { name: "Minhas Categorias" })
    ).toBeVisible({ timeout: 10000 });

    // 1. Criar nova categoria (Receita)
    await page.getByTestId("open-create-category-button").click();
    await expect(page.getByTestId("category-form-dialog")).toBeVisible();

    await page.getByTestId("category-name-input").fill(uniqueCategoryName);

    // Seleciona tipo "Receita"
    await page.getByTestId("category-type-select").click();
    await page.getByTestId("category-type-option-INCOME").click();

    await page.getByTestId("category-submit-button").click();

    // Modal fecha e nova categoria aparece na lista
    await expect(page.getByTestId("category-form-dialog")).not.toBeVisible();

    const createdCard = page
      .locator('[data-testid="category-card"]')
      .filter({ hasText: uniqueCategoryName });

    await expect(createdCard).toBeVisible({ timeout: 10000 });
    await expect(createdCard.getByTestId("category-card-type-badge")).toContainText("Receita");

    // 2. Testar filtros (Todas, Receitas, Despesas)
    await page.getByTestId("filter-expense-button").click();
    await expect(createdCard).not.toBeVisible();
    await expect(page.getByText("Alimentação")).toBeVisible();

    await page.getByTestId("filter-income-button").click();
    await expect(createdCard).toBeVisible();
    await expect(page.getByText("Alimentação")).not.toBeVisible();

    await page.getByTestId("filter-all-button").click();
    await expect(createdCard).toBeVisible();
    await expect(page.getByText("Alimentação")).toBeVisible();

    // 3. Editar categoria criada
    await createdCard.getByRole("button", { name: /opções da categoria/i }).click();
    await page.getByRole("menuitem", { name: /editar/i }).click();

    await expect(page.getByRole("heading", { name: "Editar Categoria" })).toBeVisible();
    await expect(page.getByTestId("category-name-input")).toHaveValue(uniqueCategoryName);

    await page.getByTestId("category-name-input").fill(updatedCategoryName);
    await page.getByTestId("category-submit-button").click();

    // Modal fecha e card exibe novo nome
    await expect(page.getByTestId("category-form-dialog")).not.toBeVisible();
    const updatedCard = page
      .locator('[data-testid="category-card"]')
      .filter({ hasText: updatedCategoryName });
    await expect(updatedCard).toBeVisible({ timeout: 10000 });

    // 4. Excluir categoria criada
    await updatedCard.getByRole("button", { name: /opções da categoria/i }).click();
    await page.getByRole("menuitem", { name: /excluir/i }).click();

    // Modal de confirmação
    const deleteDialog = page.getByTestId("delete-category-dialog");
    await expect(deleteDialog).toBeVisible();
    await expect(deleteDialog.getByText(updatedCategoryName)).toBeVisible();
    await page.getByTestId("confirm-delete-category-button").click();

    // Modal fecha e card é removido
    await expect(page.getByTestId("delete-category-dialog")).not.toBeVisible();
    await expect(updatedCard).not.toBeVisible({ timeout: 10000 });
  });
});
