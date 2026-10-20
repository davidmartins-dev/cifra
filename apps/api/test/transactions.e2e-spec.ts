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

type TransactionWithRelations = Transaction & {
  category?: Category | null;
  account?: Account | null;
};

describe('Transactions (e2e)', () => {
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
          balance: data.balance as unknown as Prisma.Decimal,
          userId: data.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        accountsDb.set(id, record);
        return record;
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
      }): Promise<TransactionWithRelations> => {
        const id = `tx-uuid-${transactionsDb.size + 1}`;
        const record: Transaction = {
          id,
          description: data.description,
          amount: data.amount as unknown as Prisma.Decimal,
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
        return {
          ...record,
          category: categoriesDb.get(record.categoryId),
          account: record.accountId ? accountsDb.get(record.accountId) : null,
        };
      },
      findMany: async ({
        where,
        take,
        skip,
      }: {
        where: {
          userId: string;
          type?: TransactionType;
          categoryId?: string;
          accountId?: string;
          date?: { gte?: Date; lte?: Date };
        };
        orderBy?: { date: 'desc' };
        take?: number;
        skip?: number;
      }): Promise<TransactionWithRelations[]> => {
        let results = Array.from(transactionsDb.values()).filter((tx) => tx.userId === where.userId);

        if (where.type) {
          results = results.filter((tx) => tx.type === where.type);
        }
        if (where.categoryId) {
          results = results.filter((tx) => tx.categoryId === where.categoryId);
        }
        if (where.accountId) {
          results = results.filter((tx) => tx.accountId === where.accountId);
        }
        if (where.date?.gte) {
          results = results.filter((tx) => tx.date >= where.date!.gte!);
        }
        if (where.date?.lte) {
          results = results.filter((tx) => tx.date <= where.date!.lte!);
        }

        results.sort((a, b) => b.date.getTime() - a.date.getTime());

        const start = skip ?? 0;
        const end = take ? start + take : undefined;
        const paged = results.slice(start, end);

        return paged.map((tx) => ({
          ...tx,
          category: categoriesDb.get(tx.categoryId),
          account: tx.accountId ? accountsDb.get(tx.accountId) : null,
        }));
      },
      findFirst: async ({
        where,
      }: {
        where: { id: string; userId: string };
      }): Promise<TransactionWithRelations | null> => {
        const tx = transactionsDb.get(where.id);
        if (tx && tx.userId === where.userId) {
          return {
            ...tx,
            category: categoriesDb.get(tx.categoryId),
            account: tx.accountId ? accountsDb.get(tx.accountId) : null,
          };
        }
        return null;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<Transaction>;
      }): Promise<TransactionWithRelations> => {
        const existing = transactionsDb.get(where.id)!;
        const updated: Transaction = {
          ...existing,
          ...data,
          updatedAt: new Date(),
        };
        transactionsDb.set(where.id, updated);
        return {
          ...updated,
          category: categoriesDb.get(updated.categoryId),
          account: updated.accountId ? accountsDb.get(updated.accountId) : null,
        };
      },
      delete: async ({ where }: { where: { id: string } }): Promise<Transaction> => {
        const existing = transactionsDb.get(where.id)!;
        transactionsDb.delete(where.id);
        return existing;
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

  let user1CategoryExpenseId = '';
  let user1CategoryIncomeId = '';
  let user2CategoryExpenseId = '';

  let user1AccountId = '';
  let user2AccountId = '';

  let createdTxId = '';

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

  it('Setup: cadastra User 1 e User 2 para testar isolamento', async () => {
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

    // Cria categorias e contas para testes
    const catExp1 = await mockPrismaService.category.create({
      data: { name: 'Alimentação', type: TransactionType.EXPENSE, userId: 'user-uuid-1' },
    });
    user1CategoryExpenseId = catExp1.id;

    const catInc1 = await mockPrismaService.category.create({
      data: { name: 'Salário', type: TransactionType.INCOME, userId: 'user-uuid-1' },
    });
    user1CategoryIncomeId = catInc1.id;

    const acc1 = await mockPrismaService.account.create({
      data: { name: 'Nubank', type: AccountType.CHECKING, balance: 1000, userId: 'user-uuid-1' },
    });
    user1AccountId = acc1.id;

    const catExp2 = await mockPrismaService.category.create({
      data: { name: 'Transporte', type: TransactionType.EXPENSE, userId: 'user-uuid-2' },
    });
    user2CategoryExpenseId = catExp2.id;

    const acc2 = await mockPrismaService.account.create({
      data: { name: 'Itaú', type: AccountType.CHECKING, balance: 500, userId: 'user-uuid-2' },
    });
    user2AccountId = acc2.id;
  });

  it('deve rejeitar acesso sem autenticação (401)', async () => {
    await request(app.getHttpServer()).get('/api/v1/transactions').expect(401);
    await request(app.getHttpServer()).post('/api/v1/transactions').send({}).expect(401);
    await request(app.getHttpServer()).get('/api/v1/transactions/some-id').expect(401);
    await request(app.getHttpServer()).patch('/api/v1/transactions/some-id').send({}).expect(401);
    await request(app.getHttpServer()).delete('/api/v1/transactions/some-id').expect(401);
  });

  it('POST /api/v1/transactions - deve validar payload obrigatório e formato (400)', async () => {
    // Descrição vazia
    await request(app.getHttpServer())
      .post('/api/v1/transactions')
      .set('Cookie', user1Cookie)
      .send({
        description: '',
        amount: 50,
        type: 'EXPENSE',
        date: '2026-10-20T10:00:00.000Z',
        categoryId: user1CategoryExpenseId,
      })
      .expect(400);

    // Valor negativo ou zero
    await request(app.getHttpServer())
      .post('/api/v1/transactions')
      .set('Cookie', user1Cookie)
      .send({
        description: 'Mercado',
        amount: -10,
        type: 'EXPENSE',
        date: '2026-10-20T10:00:00.000Z',
        categoryId: user1CategoryExpenseId,
      })
      .expect(400);

    // Tipo inválido
    await request(app.getHttpServer())
      .post('/api/v1/transactions')
      .set('Cookie', user1Cookie)
      .send({
        description: 'Mercado',
        amount: 50,
        type: 'INVALID_TYPE',
        date: '2026-10-20T10:00:00.000Z',
        categoryId: user1CategoryExpenseId,
      })
      .expect(400);

    // Data inválida
    await request(app.getHttpServer())
      .post('/api/v1/transactions')
      .set('Cookie', user1Cookie)
      .send({
        description: 'Mercado',
        amount: 50,
        type: 'EXPENSE',
        date: 'not-a-date',
        categoryId: user1CategoryExpenseId,
      })
      .expect(400);
  });

  it('POST /api/v1/transactions - deve rejeitar quando categoryId for de outro usuário (404)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/transactions')
      .set('Cookie', user1Cookie)
      .send({
        description: 'Uber',
        amount: 25.5,
        type: 'EXPENSE',
        date: '2026-10-20T10:00:00.000Z',
        categoryId: user2CategoryExpenseId, // Categoria do User 2
      })
      .expect(404);
  });

  it('POST /api/v1/transactions - deve rejeitar quando accountId for de outro usuário (404)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/transactions')
      .set('Cookie', user1Cookie)
      .send({
        description: 'Supermercado',
        amount: 150,
        type: 'EXPENSE',
        date: '2026-10-20T10:00:00.000Z',
        categoryId: user1CategoryExpenseId,
        accountId: user2AccountId, // Conta do User 2
      })
      .expect(404);
  });

  it('POST /api/v1/transactions - deve rejeitar quando o tipo da transação for incompatível com a categoria (400)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/transactions')
      .set('Cookie', user1Cookie)
      .send({
        description: 'Transação incompatível',
        amount: 100,
        type: 'EXPENSE',
        date: '2026-10-20T10:00:00.000Z',
        categoryId: user1CategoryIncomeId, // Categoria do tipo INCOME
      })
      .expect(400);
  });

  it('POST /api/v1/transactions - deve criar uma transação com sucesso para o User 1', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/transactions')
      .set('Cookie', user1Cookie)
      .send({
        description: '  Supermercado Semanal  ',
        amount: 120.75,
        type: 'EXPENSE',
        date: '2026-10-20T10:00:00.000Z',
        notes: '  Compras para o almoço  ',
        categoryId: user1CategoryExpenseId,
        accountId: user1AccountId,
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('description', 'Supermercado Semanal');
    expect(res.body).toHaveProperty('amount', 120.75);
    expect(res.body).toHaveProperty('notes', 'Compras para o almoço');
    expect(res.body).toHaveProperty('category');
    expect(res.body.category).toHaveProperty('id', user1CategoryExpenseId);
    expect(res.body).toHaveProperty('account');
    expect(res.body.account).toHaveProperty('id', user1AccountId);

    createdTxId = res.body.id;
  });

  it('GET /api/v1/transactions - deve listar as transações do usuário logado', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/transactions')
      .set('Cookie', user1Cookie)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].id).toBe(createdTxId);
  });

  it('GET /api/v1/transactions - deve filtrar por tipo e período', async () => {
    const resExpense = await request(app.getHttpServer())
      .get('/api/v1/transactions?type=EXPENSE')
      .set('Cookie', user1Cookie)
      .expect(200);
    expect(resExpense.body.length).toBe(1);

    const resIncome = await request(app.getHttpServer())
      .get('/api/v1/transactions?type=INCOME')
      .set('Cookie', user1Cookie)
      .expect(200);
    expect(resIncome.body.length).toBe(0);
  });

  it('GET /api/v1/transactions/:id - deve buscar detalhes da transação por ID', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/transactions/${createdTxId}`)
      .set('Cookie', user1Cookie)
      .expect(200);

    expect(res.body.id).toBe(createdTxId);
    expect(res.body.description).toBe('Supermercado Semanal');
  });

  it('PATCH /api/v1/transactions/:id - deve atualizar campos da transação', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/transactions/${createdTxId}`)
      .set('Cookie', user1Cookie)
      .send({
        description: 'Supermercado Mensal',
        amount: 250,
      })
      .expect(200);

    expect(res.body.description).toBe('Supermercado Mensal');
    expect(res.body.amount).toBe(250);
  });

  it('Isolamento Multi-Tenant: User 2 não pode visualizar, alterar ou remover transação do User 1 (404)', async () => {
    // Visualizar
    await request(app.getHttpServer())
      .get(`/api/v1/transactions/${createdTxId}`)
      .set('Cookie', user2Cookie)
      .expect(404);

    // Alterar
    await request(app.getHttpServer())
      .patch(`/api/v1/transactions/${createdTxId}`)
      .set('Cookie', user2Cookie)
      .send({ description: 'Tentativa de alteração maliciosa' })
      .expect(404);

    // Excluir
    await request(app.getHttpServer())
      .delete(`/api/v1/transactions/${createdTxId}`)
      .set('Cookie', user2Cookie)
      .expect(404);

    // Listagem do User 2 deve estar vazia
    const resListUser2 = await request(app.getHttpServer())
      .get('/api/v1/transactions')
      .set('Cookie', user2Cookie)
      .expect(200);

    expect(resListUser2.body.length).toBe(0);
  });

  it('DELETE /api/v1/transactions/:id - deve remover a transação com sucesso para o User 1', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/transactions/${createdTxId}`)
      .set('Cookie', user1Cookie)
      .expect(200);

    // Confirma que não é mais encontrada
    await request(app.getHttpServer())
      .get(`/api/v1/transactions/${createdTxId}`)
      .set('Cookie', user1Cookie)
      .expect(404);
  });
});
