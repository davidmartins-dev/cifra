import { test, expect } from "@playwright/test";

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

interface MockAccount {
  id: string;
  userId: string;
  name: string;
  type: string;
  balance: number;
  includeInTotal: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MockCategory {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
}

interface MockTransaction {
  id: string;
  userId: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  date: string;
  categoryId: string;
  accountId?: string | null;
  createdAt: string;
  updatedAt: string;
}

test.describe("E2E Marco 3 - Jornada Completa do Usuário e Resumo Financeiro", () => {
  const user: UserProfile = {
    id: "user-journey-123",
    name: "David Martins",
    email: "david.journey@cifra.app",
  };

  const accounts: MockAccount[] = [];
  const transactions: MockTransaction[] = [];

  const categories: MockCategory[] = [
    { id: "cat-salario", name: "Salário Empresa", type: "INCOME" },
    { id: "cat-mercado", name: "Supermercado Mensal", type: "EXPENSE" },
  ];

  test.beforeEach(async ({ page, context }) => {
    // Limpa estado em memória para cada execução
    accounts.length = 0;
    transactions.length = 0;

    // 1. Mock de Cadastro (Email verification send -> verify -> register)
    await page.route("**/api/auth/email-verification/send", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Código enviado com sucesso" }),
      });
    });

    await page.route("**/api/auth/email-verification/verify", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          verified: true,
          message: "Código verificado com sucesso",
          verificationTicket: "ticket-valid-journey-123",
        }),
      });
    });

    await page.route("**/api/auth/register", async (route) => {
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
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        headers: {
          "Set-Cookie": "cifra_e2e_auth=true; Path=/; HttpOnly",
        },
        body: JSON.stringify({
          user,
          tokens: { accessToken: "token-abc", refreshToken: "token-ref" },
        }),
      });
    });

    // 2. Mock de Login
    await page.route("**/api/auth/login", async (route) => {
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
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "Set-Cookie": "cifra_e2e_auth=true; Path=/; HttpOnly",
        },
        body: JSON.stringify({
          user,
          tokens: { accessToken: "token-abc", refreshToken: "token-ref" },
        }),
      });
    });

    // 3. Mock de Logout
    await page.route("**/api/auth/logout", async (route) => {
      await context.clearCookies();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Sessão encerrada" }),
      });
    });

    // 4. Mock de Sessão (Auth Me)
    await page.route("**/api/auth/me", async (route) => {
      const cookies = await context.cookies();
      const hasSession = cookies.some((c) => c.name === "cifra_e2e_auth");
      if (hasSession) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ user }),
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ message: "Não autorizado" }),
        });
      }
    });

    // 5. Mock de Categorias
    await page.route("**/api/categories**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(categories),
      });
    });

    // 6. Mock de Contas Financeiras
    await page.route("**/api/accounts**", async (route) => {
      const method = route.request().method();
      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(accounts),
        });
      } else if (method === "POST") {
        const body = (await route.request().postDataJSON()) as {
          name: string;
          type: string;
          balance: number;
        };
        const newAcc: MockAccount = {
          id: `acc-${Date.now()}`,
          userId: user.id,
          name: body.name,
          type: body.type,
          balance: Number(body.balance) || 0,
          includeInTotal: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        accounts.push(newAcc);
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(newAcc),
        });
      } else {
        await route.fallback();
      }
    });

    // 7. Mock de Transações
    await page.route("**/api/transactions**", async (route) => {
      const method = route.request().method();
      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(transactions),
        });
      } else if (method === "POST") {
        const body = (await route.request().postDataJSON()) as {
          description: string;
          amount: number;
          type: "INCOME" | "EXPENSE";
          date: string;
          categoryId: string;
          accountId?: string | null;
        };
        const newTx: MockTransaction = {
          id: `tx-${Date.now()}`,
          userId: user.id,
          description: body.description,
          amount: Number(body.amount),
          type: body.type,
          date: body.date,
          categoryId: body.categoryId,
          accountId: body.accountId ?? null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        transactions.push(newTx);

        // Atualiza saldo da conta associada se houver
        if (body.accountId) {
          const targetAcc = accounts.find((a) => a.id === body.accountId);
          if (targetAcc) {
            if (body.type === "INCOME") {
              targetAcc.balance += Number(body.amount);
            } else {
              targetAcc.balance -= Number(body.amount);
            }
          }
        }

        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(newTx),
        });
      } else {
        await route.fallback();
      }
    });

    // 8. Mock de Resumo Financeiro (/financial-summary/overview)
    await page.route("**/api/financial-summary/overview**", async (route) => {
      const totalIncome = transactions
        .filter((t) => t.type === "INCOME")
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = transactions
        .filter((t) => t.type === "EXPENSE")
        .reduce((sum, t) => sum + t.amount, 0);
      const accountsBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
      const currentBalance = accountsBalance + (transactions.some((t) => !t.accountId) ? totalIncome - totalExpense : 0);
      const incomeCount = transactions.filter((t) => t.type === "INCOME").length;
      const expenseCount = transactions.filter((t) => t.type === "EXPENSE").length;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          currentBalance,
          totalIncome,
          totalExpense,
          netBalance: totalIncome - totalExpense,
          incomeCount,
          expenseCount,
        }),
      });
    });
  });

  test("deve executar com sucesso o fluxo completo: Cadastro -> Dashboard -> Contas -> Transações -> Resumo Atualizado -> Logout", async ({
    page,
  }) => {
    // 1. Inicia o cadastro em /register
    await page.goto("/register");
    await expect(page.getByText("Crie sua conta")).toBeVisible();

    // Etapa 1: E-mail
    await page.getByLabel(/^e-mail$/i).fill(user.email);
    await page.getByRole("button", { name: /^continuar$/i }).click();

    // Etapa 2: Código OTP
    await expect(page.getByText("Verifique seu e-mail")).toBeVisible();
    await page.locator("input[data-input-otp='true']").evaluate(
      (el: HTMLInputElement, code: string) => {
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        )?.set;
        nativeSetter?.call(el, code);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      },
      "123456"
    );

    const continueBtn = page.getByRole("button", { name: /^continuar$/i });
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();

    // Etapa 3: Perfil e Senha
    await expect(page.getByText("Configure seu perfil")).toBeVisible();
    await page.getByLabel(/nome completo/i).fill(user.name);
    await page.getByLabel(/^senha$/i).fill("SenhaForte123!");
    await page.getByLabel(/confirmar senha/i).fill("SenhaForte123!");

    const finishBtn = page.getByRole("button", { name: /finalizar e acessar o cifra/i });
    await expect(finishBtn).toBeEnabled();
    await finishBtn.click();

    // 2. Redirecionamento para o Dashboard
    await expect(page).toHaveURL(/(\/dashboard|\/login)/);

    // Se redirecionou para login para autenticar
    if (page.url().includes("/login")) {
      await page.getByLabel(/^e-mail$/i).fill(user.email);
      await page.getByLabel(/^senha$/i).fill("SenhaForte123!");
      await page.getByRole("button", { name: /^entrar$/i }).click();
      await expect(page).toHaveURL(/\/dashboard/);
    }

    // 3. Validação do Dashboard Inicial
    await expect(page.getByRole("heading", { name: /olá,/i })).toBeVisible();
    await expect(page.getByTestId("dashboard-current-balance")).toContainText(/0,00/);
    await expect(page.getByTestId("dashboard-total-income")).toContainText(/0,00/);
    await expect(page.getByTestId("dashboard-total-expense")).toContainText(/0,00/);
    await expect(page.getByText(/nenhuma transação registrada ainda/i)).toBeVisible();

    // 4. Navegação para Contas e Criação da Primeira Conta
    await page.getByRole("link", { name: /gerenciar contas/i }).first().click();
    await expect(page).toHaveURL(/\/accounts/);
    await expect(page.getByRole("heading", { name: /minhas contas/i })).toBeVisible();

    // Abre modal de nova conta
    await page.getByTestId("open-create-account-button").click();
    await expect(page.getByTestId("account-form-dialog")).toBeVisible();

    await page.getByTestId("account-name-input").fill("Conta Corrente Nubank");
    await page.getByTestId("account-type-select").click();
    await page.getByTestId("account-type-option-CHECKING").click();
    await page.getByTestId("account-balance-input").fill("300000"); // R$ 3.000,00
    await page.getByRole("button", { name: /criar conta/i }).click();

    // Valida que a conta criada aparece na lista
    await expect(page.getByTestId("account-form-dialog")).toBeHidden();
    await expect(page.getByRole("heading", { name: "Conta Corrente Nubank" })).toBeVisible();

    // 5. Navegação para Transações e Lançamento de Receita e Despesa
    await page.goto("/transactions");
    await expect(page).toHaveURL(/\/transactions/);
    await expect(page.getByRole("heading", { name: /minhas transações/i })).toBeVisible();

    // 5.1 Criar Receita: R$ 5.000,00
    await page.getByTestId("open-create-transaction-button").click();
    await expect(page.getByTestId("transaction-form-dialog")).toBeVisible();

    await page.getByTestId("transaction-type-income-btn").click();
    await page.getByTestId("transaction-description-input").fill("Salário Mensal");
    await page.getByTestId("transaction-amount-input").fill("500000"); // R$ 5.000,00

    await page.getByTestId("transaction-category-select").click();
    await page.getByTestId("transaction-category-option-cat-salario").click();

    await page.getByTestId("transaction-submit-button").click();
    await expect(page.getByTestId("transaction-form-dialog")).toBeHidden();
    await expect(page.locator('[data-testid="transaction-card"]').filter({ hasText: "Salário Mensal" })).toBeVisible();

    // 5.2 Criar Despesa: R$ 1.500,00
    await page.getByTestId("open-create-transaction-button").click();
    await expect(page.getByTestId("transaction-form-dialog")).toBeVisible();

    await page.getByTestId("transaction-type-expense-btn").click();
    await page.getByTestId("transaction-description-input").fill("Supermercado Mensal");
    await page.getByTestId("transaction-amount-input").fill("150000"); // R$ 1.500,00

    await page.getByTestId("transaction-category-select").click();
    await page.getByTestId("transaction-category-option-cat-mercado").click();

    await page.getByTestId("transaction-submit-button").click();
    await expect(page.getByTestId("transaction-form-dialog")).toBeHidden();
    await expect(page.locator('[data-testid="transaction-card"]').filter({ hasText: "Supermercado Mensal" })).toBeVisible();

    // 6. Retorno ao Dashboard e Verificação do Resumo Consolidado
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);

    // Saldo Total: R$ 6.500,00 (3.000 saldo inicial + 5.000 receita - 1.500 despesa)
    await expect(page.getByTestId("dashboard-current-balance")).toContainText(/6\.500,00/);
    // Receitas do Mês: R$ 5.000,00
    await expect(page.getByTestId("dashboard-total-income")).toContainText(/5\.000,00/);
    // Despesas do Mês: R$ 1.500,00
    await expect(page.getByTestId("dashboard-total-expense")).toContainText(/1\.500,00/);
    // Saldo Líquido: R$ 3.500,00 (5.000 - 1.500)
    await expect(page.getByTestId("dashboard-net-balance")).toContainText(/3\.500,00/);
    // Atividade recente atualizada
    await expect(page.getByText(/2 movimentação\(ões\) ativa\(s\) registrada\(s\)/i)).toBeVisible();

    // 7. Encerramento de Sessão (Logout)
    await page.getByRole("button", { name: /^sair$/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
