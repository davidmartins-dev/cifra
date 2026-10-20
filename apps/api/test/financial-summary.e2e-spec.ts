import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Account, AccountType, Category, Prisma, Transaction, TransactionType, User } from '@prisma/client';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { AUTH_COOKIE_NAME } from '../src/modules/auth/jwt.strategy.js';
import { PrismaService } from '../src/shared/database/prisma.service.js';

interface MonthlyEvolutionMonth {
  month: number;
  monthName: string;
  income: number;
  expense: number;
  net: number;
}

interface MonthlyEvolutionResponse {
  year: number;
  totalIncome: number;
  totalExpense: number;
  netTotal: number;
  months: MonthlyEvolutionMonth[];
}

interface TransactionFilterWhere {
  userId: string;
  type?: TransactionType;
  accountId?: string;
  date?: { gte?: Date; lte?: Date };
}

describe('FinancialSummary (e2e)', () => {
  let app: INestApplication<App>;

  const usersDb = new Map<string, User>();
  const accountsDb = new Map<string, Account>();
  const categoriesDb = new Map<string, Category>();
  const transactionsDb = new Map<string, Transaction>();

  const mockPrismaService = {
    $queryRaw: async (): Promise<Array<{ 1: number }>> => [{ 1: 1 }],
    user: {
      findUnique: async ({
        where,
      }: {
        where: { email?: string; id?: string };
      }): Promise<User | null> => {
        if (where.id) {
          return usersDb.get(where.id) ?? null;
        }
        if (where.email) {
          for (const u of usersDb.values()) {
            if (u.email === where.email) return u;
          }
        }
        return null;
      },
      create: async ({
        data,
      }: {
        data: Pick<User, 'name' | 'email' | 'passwordHash'>;
      }): Promise<User> => {
        const id = `user-uuid-${usersDb.size + 1}`;
        const record: User = {
          id,
          name: data.name,
          email: data.email,
          passwordHash: data.passwordHash,
          role: 'USER',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        usersDb.set(id, record);
        return record;
      },
    },
    emailVerification: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        if (where.id.startsWith('valid-ticket-')) {
          return {
            id: where.id,
            email: where.id.replace('valid-ticket-', ''),
            purpose: 'SIGNUP',
            consumedAt: new Date(),
          };
        }
        return null;
      },
      delete: async () => ({ id: 'ticket' }),
    },
    account: {
      create: async ({
        data,
      }: {
        data: { name: string; type: AccountType; balance: number; userId: string };
      }): Promise<Account> => {
        const id = `acc-uuid-${accountsDb.size + 1}`;
        const record: Account = {
          id,
          name: data.name,
          type: data.type,
          balance: new Prisma.Decimal(data.balance),
          userId: data.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        accountsDb.set(id, record);
        return record;
      },
      findMany: async ({
        where,
      }: {
        where: { userId: string; id?: string };
      }): Promise<Account[]> => {
        return Array.from(accountsDb.values()).filter(
          (acc) => acc.userId === where.userId && (!where.id || acc.id === where.id),
        );
      },
      findFirst: async ({
        where,
      }: {
        where: { id: string; userId: string };
      }): Promise<Account | null> => {
        const acc = accountsDb.get(where.id);
        if (acc && acc.userId === where.userId) {
          return acc;
        }
        return null;
      },
    },
    category: {
      create: async ({
        data,
      }: {
        data: { name: string; type: TransactionType; userId: string };
      }): Promise<Category> => {
        const id = `cat-uuid-${categoriesDb.size + 1}`;
        const record: Category = {
          id,
          name: data.name,
          type: data.type,
          userId: data.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        categoriesDb.set(id, record);
        return record;
      },
      findMany: async ({
        where,
      }: {
        where: { id?: { in: string[] }; userId: string };
      }): Promise<Category[]> => {
        return Array.from(categoriesDb.values()).filter((cat) => {
          if (cat.userId !== where.userId) return false;
          if (where.id?.in && !where.id.in.includes(cat.id)) return false;
          return true;
        });
      },
      findFirst: async ({
        where,
      }: {
        where: { id: string; userId: string };
      }): Promise<Category | null> => {
        const cat = categoriesDb.get(where.id);
        if (cat && cat.userId === where.userId) {
          return cat;
        }
        return null;
      },
    },
    transaction: {
      create: async ({
        data,
      }: {
        data: {
          description: string;
          amount: number;
          type: TransactionType;
          date: Date;
          notes: string | null;
          userId: string;
          categoryId: string;
          accountId: string | null;
        };
      }): Promise<Transaction> => {
        const id = `tx-uuid-${transactionsDb.size + 1}`;
        const record: Transaction = {
          id,
          description: data.description,
          amount: new Prisma.Decimal(data.amount),
          type: data.type,
          date: data.date,
          notes: data.notes,
          userId: data.userId,
          categoryId: data.categoryId,
          accountId: data.accountId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        transactionsDb.set(id, record);
        return record;
      },
      aggregate: async ({
        where,
      }: {
        where: TransactionFilterWhere;
      }): Promise<{ _sum: { amount: Prisma.Decimal | null }; _count: { id: number } }> => {
        let filtered = Array.from(transactionsDb.values()).filter(
          (tx) => tx.userId === where.userId && (!where.type || tx.type === where.type),
        );
        if (where.accountId) {
          filtered = filtered.filter((tx) => tx.accountId === where.accountId);
        }
        if (where.date?.gte) {
          filtered = filtered.filter((tx) => tx.date >= where.date!.gte!);
        }
        if (where.date?.lte) {
          filtered = filtered.filter((tx) => tx.date <= where.date!.lte!);
        }
        const sum = filtered.reduce((acc, curr) => acc + Number(curr.amount), 0);
        return {
          _sum: { amount: filtered.length > 0 ? new Prisma.Decimal(sum) : null },
          _count: { id: filtered.length },
        };
      },
      groupBy: async ({
        where,
      }: {
        by: string[];
        where: TransactionFilterWhere;
      }): Promise<Array<{ categoryId: string; _sum: { amount: Prisma.Decimal }; _count: { id: number } }>> => {
        let filtered = Array.from(transactionsDb.values()).filter(
          (tx) => tx.userId === where.userId && (!where.type || tx.type === where.type),
        );
        if (where.accountId) {
          filtered = filtered.filter((tx) => tx.accountId === where.accountId);
        }
        if (where.date?.gte) {
          filtered = filtered.filter((tx) => tx.date >= where.date!.gte!);
        }
        if (where.date?.lte) {
          filtered = filtered.filter((tx) => tx.date <= where.date!.lte!);
        }
        const groupMap = new Map<string, { sum: number; count: number }>();
        for (const tx of filtered) {
          const current = groupMap.get(tx.categoryId) ?? { sum: 0, count: 0 };
          groupMap.set(tx.categoryId, {
            sum: current.sum + Number(tx.amount),
            count: current.count + 1,
          });
        }
        return Array.from(groupMap.entries()).map(([categoryId, data]) => ({
          categoryId,
          _sum: { amount: new Prisma.Decimal(data.sum) },
          _count: { id: data.count },
        }));
      },
      findMany: async ({
        where,
      }: {
        where: { userId: string; date?: { gte?: Date; lte?: Date } };
      }): Promise<Transaction[]> => {
        let filtered = Array.from(transactionsDb.values()).filter(
          (tx) => tx.userId === where.userId,
        );
        if (where.date?.gte) {
          filtered = filtered.filter((tx) => tx.date >= where.date!.gte!);
        }
        if (where.date?.lte) {
          filtered = filtered.filter((tx) => tx.date <= where.date!.lte!);
        }
        return filtered;
      },
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  let user1Cookie = '';
  let user2Cookie = '';

  let user1AccountId = '';
  let user2AccountId = '';

  const getSetCookieHeaders = (res: request.Response): string[] => {
    const header = res.headers['set-cookie'] as unknown;
    if (Array.isArray(header)) {
      return header.filter((item): item is string => typeof item === 'string');
    }
    if (typeof header === 'string') {
      return [header];
    }
    return [];
  };

  it('Setup: cadastra User 1 e User 2 e popula lançamentos para teste', async () => {
    const res1 = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'User One',
        email: 'user1@example.com',
        password: 'Password123!',
        verificationTicket: 'valid-ticket-user1@example.com',
      })
      .expect(201);

    const cookies1 = getSetCookieHeaders(res1);
    user1Cookie = cookies1.find((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`))!.split(';')[0];

    const res2 = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'User Two',
        email: 'user2@example.com',
        password: 'Password123!',
        verificationTicket: 'valid-ticket-user2@example.com',
      })
      .expect(201);

    const cookies2 = getSetCookieHeaders(res2);
    user2Cookie = cookies2.find((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`))!.split(';')[0];

    // Cria contas
    const acc1 = await mockPrismaService.account.create({
      data: { name: 'Nubank', type: AccountType.CHECKING, balance: 2500, userId: 'user-uuid-1' },
    });
    user1AccountId = acc1.id;

    const acc2 = await mockPrismaService.account.create({
      data: { name: 'Itaú', type: AccountType.CHECKING, balance: 800, userId: 'user-uuid-2' },
    });
    user2AccountId = acc2.id;

    // Categorias do User 1
    const catSalario = await mockPrismaService.category.create({
      data: { name: 'Salário', type: TransactionType.INCOME, userId: 'user-uuid-1' },
    });
    const catMercado = await mockPrismaService.category.create({
      data: { name: 'Mercado', type: TransactionType.EXPENSE, userId: 'user-uuid-1' },
    });
    const catLazer = await mockPrismaService.category.create({
      data: { name: 'Lazer', type: TransactionType.EXPENSE, userId: 'user-uuid-1' },
    });

    // Transações do User 1
    await mockPrismaService.transaction.create({
      data: {
        description: 'Salário de Outubro',
        amount: 6000,
        type: TransactionType.INCOME,
        date: new Date('2026-10-05T10:00:00.000Z'),
        notes: null,
        userId: 'user-uuid-1',
        categoryId: catSalario.id,
        accountId: user1AccountId,
      },
    });

    await mockPrismaService.transaction.create({
      data: {
        description: 'Supermercado',
        amount: 800,
        type: TransactionType.EXPENSE,
        date: new Date('2026-10-10T12:00:00.000Z'),
        notes: null,
        userId: 'user-uuid-1',
        categoryId: catMercado.id,
        accountId: user1AccountId,
      },
    });

    await mockPrismaService.transaction.create({
      data: {
        description: 'Cinema e Jantar',
        amount: 200,
        type: TransactionType.EXPENSE,
        date: new Date('2026-10-12T20:00:00.000Z'),
        notes: null,
        userId: 'user-uuid-1',
        categoryId: catLazer.id,
        accountId: user1AccountId,
      },
    });
  });

  it('deve rejeitar requisições sem autenticação (401)', async () => {
    await request(app.getHttpServer()).get('/api/v1/financial-summary/overview').expect(401);
    await request(app.getHttpServer()).get('/api/v1/financial-summary/by-category').expect(401);
    await request(app.getHttpServer()).get('/api/v1/financial-summary/monthly-evolution').expect(401);
  });

  it('GET /api/v1/financial-summary/overview - deve calcular saldo, receitas, despesas e saldo líquido', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/financial-summary/overview')
      .set('Cookie', user1Cookie)
      .expect(200);

    expect(res.body).toEqual({
      currentBalance: 2500,
      totalIncome: 6000,
      totalExpense: 1000,
      netBalance: 5000,
      incomeCount: 1,
      expenseCount: 2,
    });
  });

  it('GET /api/v1/financial-summary/overview - deve rejeitar consulta de conta de outro usuário (404)', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/financial-summary/overview?accountId=${user2AccountId}`)
      .set('Cookie', user1Cookie)
      .expect(404);
  });

  it('GET /api/v1/financial-summary/by-category - deve retornar gastos agrupados por categoria com percentuais', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/financial-summary/by-category?type=EXPENSE')
      .set('Cookie', user1Cookie)
      .expect(200);

    expect(res.body.type).toBe('EXPENSE');
    expect(res.body.totalAmount).toBe(1000);
    expect(res.body.categories.length).toBe(2);

    // Mercado: 800 de 1000 = 80%
    expect(res.body.categories[0]).toEqual({
      categoryId: expect.any(String),
      categoryName: 'Mercado',
      amount: 800,
      percentage: 80,
      count: 1,
    });

    // Lazer: 200 de 1000 = 20%
    expect(res.body.categories[1]).toEqual({
      categoryId: expect.any(String),
      categoryName: 'Lazer',
      amount: 200,
      percentage: 20,
      count: 1,
    });
  });

  it('GET /api/v1/financial-summary/monthly-evolution - deve retornar a evolução mensal dos 12 meses', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/financial-summary/monthly-evolution?year=2026')
      .set('Cookie', user1Cookie)
      .expect(200);

    expect(res.body.year).toBe(2026);
    expect(res.body.totalIncome).toBe(6000);
    expect(res.body.totalExpense).toBe(1000);
    expect(res.body.netTotal).toBe(5000);
    expect(res.body.months.length).toBe(12);

    const body = res.body as MonthlyEvolutionResponse;

    // Mês 10 (Outubro)
    const outubro = body.months.find((m) => m.month === 10);
    expect(outubro).toEqual({
      month: 10,
      monthName: 'Outubro',
      income: 6000,
      expense: 1000,
      net: 5000,
    });

    // Mês 1 (Janeiro - zerado)
    const janeiro = body.months.find((m) => m.month === 1);
    expect(janeiro).toEqual({
      month: 1,
      monthName: 'Janeiro',
      income: 0,
      expense: 0,
      net: 0,
    });
  });

  it('Isolamento Multi-Tenant: Usuário 2 deve receber totais próprios e não visualizar dados do Usuário 1', async () => {
    const resOverview = await request(app.getHttpServer())
      .get('/api/v1/financial-summary/overview')
      .set('Cookie', user2Cookie)
      .expect(200);

    expect(resOverview.body).toEqual({
      currentBalance: 800, // Saldo da conta do User 2
      totalIncome: 0,
      totalExpense: 0,
      netBalance: 0,
      incomeCount: 0,
      expenseCount: 0,
    });

    const resByCategory = await request(app.getHttpServer())
      .get('/api/v1/financial-summary/by-category')
      .set('Cookie', user2Cookie)
      .expect(200);

    expect(resByCategory.body.totalAmount).toBe(0);
    expect(resByCategory.body.categories.length).toBe(0);
  });
});
