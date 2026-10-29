import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Acessibilidade Automatizada (a11y) - WCAG 2.1 AA", () => {
  // Helper de análise axe-core padronizado
  const runA11yScan = async (page: Page) => {
    return new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast"]) // Contraste de cor tratado na paleta de temas
      .analyze();
  };

  test.describe("1. Telas Públicas", () => {
    test("deve validar acessibilidade da Landing Page (/)", async ({ page }) => {
      await page.goto("/");
      const scan = await runA11yScan(page);
      expect(scan.violations).toEqual([]);
    });

    test("deve validar acessibilidade da página de Login (/login)", async ({ page }) => {
      await page.goto("/login");
      const scan = await runA11yScan(page);
      expect(scan.violations).toEqual([]);
    });

    test("deve validar acessibilidade da página de Cadastro (/register)", async ({ page }) => {
      await page.goto("/register");
      const scan = await runA11yScan(page);
      expect(scan.violations).toEqual([]);
    });

    test("deve validar acessibilidade da página de Recuperação de Senha (/forgot-password)", async ({
      page,
    }) => {
      await page.goto("/forgot-password");
      const scan = await runA11yScan(page);
      expect(scan.violations).toEqual([]);
    });

    test("deve validar acessibilidade da página de Redefinição de Senha (/reset-password)", async ({
      page,
    }) => {
      await page.goto("/reset-password");
      const scan = await runA11yScan(page);
      expect(scan.violations).toEqual([]);
    });
  });

  test.describe("2. Telas Privadas Autenticadas", () => {
    test.beforeEach(async ({ context, page }) => {
      // Mock de autenticação via cookie reconhecido pelo middleware
      await context.addCookies([
        {
          name: "cifra_e2e_auth",
          value: "true",
          domain: "127.0.0.1",
          path: "/",
        },
      ]);

      // Mocks de dados para renderização completa das telas privadas
      await page.route("**/api/auth/me", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            user: { id: "u-123", email: "david@cifra.app", name: "David Martins" },
          }),
        });
      });

      await page.route("**/api/accounts**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "acc-1",
              name: "Conta Corrente",
              type: "CHECKING",
              balance: 3500,
              includeInTotal: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]),
        });
      });

      await page.route("**/api/categories**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "cat-1",
              name: "Salário",
              type: "INCOME",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: "cat-2",
              name: "Alimentação",
              type: "EXPENSE",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]),
        });
      });

      await page.route("**/api/transactions**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "tx-1",
              description: "Salário Mensal",
              amount: 5000,
              type: "INCOME",
              date: new Date().toISOString(),
              categoryId: "cat-1",
              accountId: "acc-1",
              category: { id: "cat-1", name: "Salário", type: "INCOME" },
              account: { id: "acc-1", name: "Conta Corrente" },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]),
        });
      });

      await page.route("**/api/financial-summary/**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            currentBalance: 3500,
            totalIncome: 5000,
            totalExpense: 1500,
            netBalance: 3500,
            incomeCount: 1,
            expenseCount: 1,
            categories: [],
          }),
        });
      });
    });

    test("deve validar acessibilidade do Dashboard (/dashboard)", async ({ page }) => {
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");
      const scan = await runA11yScan(page);
      expect(scan.violations).toEqual([]);
    });

    test("deve validar acessibilidade da Gestão de Contas (/accounts)", async ({ page }) => {
      await page.goto("/accounts");
      await page.waitForLoadState("networkidle");
      const scan = await runA11yScan(page);
      expect(scan.violations).toEqual([]);
    });

    test("deve validar acessibilidade da Gestão de Categorias (/categories)", async ({ page }) => {
      await page.goto("/categories");
      await page.waitForLoadState("networkidle");
      const scan = await runA11yScan(page);
      expect(scan.violations).toEqual([]);
    });

    test("deve validar acessibilidade da Gestão de Transações (/transactions)", async ({
      page,
    }) => {
      await page.goto("/transactions");
      await page.waitForLoadState("networkidle");
      const scan = await runA11yScan(page);
      expect(scan.violations).toEqual([]);
    });
  });

  test.describe("3. Modais e Diálogos Interativos (Estados Abertos)", () => {
    test.beforeEach(async ({ context, page }) => {
      await context.addCookies([
        {
          name: "cifra_e2e_auth",
          value: "true",
          domain: "127.0.0.1",
          path: "/",
        },
      ]);

      await page.route("**/api/auth/me", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            user: { id: "u-123", email: "david@cifra.app", name: "David Martins" },
          }),
        });
      });

      await page.route("**/api/accounts**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      });

      await page.route("**/api/categories**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      });

      await page.route("**/api/transactions**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      });
    });

    test("deve validar acessibilidade do Modal de Nova Conta quando aberto", async ({ page }) => {
      await page.goto("/accounts");
      await page.getByRole("button", { name: /nova conta/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      const scan = await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .disableRules(["color-contrast"])
        .analyze();

      expect(scan.violations).toEqual([]);
    });

    test("deve validar acessibilidade do Modal de Nova Categoria quando aberto", async ({
      page,
    }) => {
      await page.goto("/categories");
      await page.getByRole("button", { name: /nova categoria/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      const scan = await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .disableRules(["color-contrast"])
        .analyze();

      expect(scan.violations).toEqual([]);
    });

    test("deve validar acessibilidade do Modal de Nova Transação quando aberto", async ({
      page,
    }) => {
      await page.goto("/transactions");
      await page.getByRole("button", { name: /nova transação/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      const scan = await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .disableRules(["color-contrast"])
        .analyze();

      expect(scan.violations).toEqual([]);
    });
  });
});
