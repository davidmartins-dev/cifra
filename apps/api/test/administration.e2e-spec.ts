import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Account, AccountType, Category, Prisma, Transaction, TransactionType, User, UserRole } from '@prisma/client';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { AUTH_COOKIE_NAME } from '../src/modules/auth/jwt.strategy.js';
import { PrismaService } from '../src/shared/database/prisma.service.js';

type UserWithCounts = User & {
  _count: {
    accounts: number;
    transactions: number;
    categories: number;
  };
};

type UserSummaryWithCounts = Pick<
  User,
  'id' | 'name' | 'email' | 'role' | 'createdAt' | 'updatedAt'
> & {
  _count: {
    accounts: number;
    transactions: number;
    categories: number;
  };
};

interface UserFilterWhere {
  role?: UserRole;
  OR?: Array<{
    name?: { contains: string; mode?: string };
    email?: { contains: string; mode?: string };
  }>;
}

describe('Administration (e2e)', () => {
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
      }): Promise<UserWithCounts | null> => {
        let user: User | null = null;
        if (where.id) {
          user = usersDb.get(where.id) ?? null;
        } else if (where.email) {
          for (const u of usersDb.values()) {
            if (u.email === where.email) {
              user = u;
              break;
            }
          }
        }

        if (!user) return null;

        const accountsCount = Array.from(accountsDb.values()).filter(
          (a) => a.userId === user!.id,
        ).length;
        const transactionsCount = Array.from(transactionsDb.values()).filter(
          (t) => t.userId === user!.id,
        ).length;
        const categoriesCount = Array.from(categoriesDb.values()).filter(
          (c) => c.userId === user!.id,
        ).length;

        return {
          ...user,
          _count: {
            accounts: accountsCount,
            transactions: transactionsCount,
            categories: categoriesCount,
          },
        };
      },
      findMany: async ({
        where,
        take,
        skip,
      }: {
        where?: UserFilterWhere;
        take?: number;
        skip?: number;
      }): Promise<UserSummaryWithCounts[]> => {
        let results = Array.from(usersDb.values());

        if (where?.role) {
          results = results.filter((u) => u.role === where.role);
        }

        if (where?.OR) {
          const searchTerm = (where.OR[0].name?.contains ?? '').toLowerCase();
          results = results.filter(
            (u) =>
              u.name.toLowerCase().includes(searchTerm) ||
              u.email.toLowerCase().includes(searchTerm),
          );
        }

        const start = skip ?? 0;
        const end = take ? start + take : undefined;
        const paged = results.slice(start, end);

        return paged.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          _count: {
            accounts: Array.from(accountsDb.values()).filter((a) => a.userId === u.id).length,
            transactions: Array.from(transactionsDb.values()).filter((t) => t.userId === u.id).length,
            categories: Array.from(categoriesDb.values()).filter((c) => c.userId === u.id).length,
          },
        }));
      },
      count: async (args?: { where?: UserFilterWhere }): Promise<number> => {
        let results = Array.from(usersDb.values());
        const where = args?.where;
        if (where?.role) {
          results = results.filter((u) => u.role === where.role);
        }
        if (where?.OR) {
          const searchTerm = (where.OR[0].name?.contains ?? '').toLowerCase();
          results = results.filter(
            (u) =>
              u.name.toLowerCase().includes(searchTerm) ||
              u.email.toLowerCase().includes(searchTerm),
          );
        }
        return results.length;
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
          role: UserRole.USER,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        usersDb.set(id, record);
        return record;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<User>;
      }): Promise<Pick<User, 'id' | 'name' | 'email' | 'role' | 'updatedAt'>> => {
        const existing = usersDb.get(where.id)!;
        const updated: User = {
          ...existing,
          ...data,
          updatedAt: new Date(),
        };
        usersDb.set(where.id, updated);
        return {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          role: updated.role,
          updatedAt: updated.updatedAt,
        };
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
      count: async (): Promise<number> => accountsDb.size,
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
      aggregate: async (): Promise<{
        _count: { id: number };
        _sum: { amount: Prisma.Decimal | null };
      }> => {
        const total = Array.from(transactionsDb.values()).reduce(
          (acc, curr) => acc + Number(curr.amount),
          0,
        );
        return {
          _count: { id: transactionsDb.size },
          _sum: { amount: transactionsDb.size > 0 ? new Prisma.Decimal(total) : null },
        };
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

  let adminCookie = '';
  let regularUserCookie = '';
  let adminUserId = '';
  let regularUserId = '';

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

  it('Setup: cadastra Admin e Usuário Regular, e popula métricas', async () => {
    // 1. Cadastra Admin
    const resAdmin = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Administrador Chefe',
        email: 'admin@example.com',
        password: 'Password123!',
        verificationTicket: 'valid-ticket-admin@example.com',
      })
      .expect(201);

    adminUserId = resAdmin.body.user.id;
    // Eleva papel para ADMIN no banco mockado
    const adminRecord = usersDb.get(adminUserId)!;
    adminRecord.role = UserRole.ADMIN;
    usersDb.set(adminUserId, adminRecord);

    const cookiesAdmin = getSetCookieHeaders(resAdmin);
    adminCookie = cookiesAdmin.find((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`))!.split(';')[0];

    // 2. Cadastra Usuário Regular (role: USER)
    const resUser = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Usuario Comum',
        email: 'user@example.com',
        password: 'Password123!',
        verificationTicket: 'valid-ticket-user@example.com',
      })
      .expect(201);

    regularUserId = resUser.body.user.id;
    const cookiesUser = getSetCookieHeaders(resUser);
    regularUserCookie = cookiesUser.find((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`))!.split(';')[0];

    // Popula contas e transações
    await mockPrismaService.account.create({
      data: { name: 'Conta Teste', type: AccountType.CHECKING, balance: 1000, userId: regularUserId },
    });

    const cat = await mockPrismaService.category.create({
      data: { name: 'Geral', type: TransactionType.EXPENSE, userId: regularUserId },
    });

    await mockPrismaService.transaction.create({
      data: {
        description: 'Compra Teste',
        amount: 250,
        type: TransactionType.EXPENSE,
        date: new Date(),
        notes: null,
        userId: regularUserId,
        categoryId: cat.id,
        accountId: null,
      },
    });
  });

  it('deve rejeitar acesso sem autenticação (401)', async () => {
    await request(app.getHttpServer()).get('/api/v1/administration/metrics').expect(401);
    await request(app.getHttpServer()).get('/api/v1/administration/users').expect(401);
    await request(app.getHttpServer()).get(`/api/v1/administration/users/${regularUserId}`).expect(401);
    await request(app.getHttpServer()).patch(`/api/v1/administration/users/${regularUserId}/role`).send({ role: 'ADMIN' }).expect(401);
  });

  it('deve bloquear usuário com role USER com 403 Forbidden', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/administration/metrics')
      .set('Cookie', regularUserCookie)
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/v1/administration/users')
      .set('Cookie', regularUserCookie)
      .expect(403);

    await request(app.getHttpServer())
      .get(`/api/v1/administration/users/${regularUserId}`)
      .set('Cookie', regularUserCookie)
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/api/v1/administration/users/${regularUserId}/role`)
      .set('Cookie', regularUserCookie)
      .send({ role: 'ADMIN' })
      .expect(403);
  });

  it('GET /api/v1/administration/metrics - deve retornar métricas da plataforma para o ADMIN (200)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/administration/metrics')
      .set('Cookie', adminCookie)
      .expect(200);

    expect(res.body).toEqual({
      totalUsers: 2,
      totalAccounts: 1,
      totalTransactions: 1,
      totalTransactionVolume: 250,
    });
  });

  it('GET /api/v1/administration/users - deve listar usuários com paginação e busca (200)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/administration/users?search=comum')
      .set('Cookie', adminCookie)
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('meta');
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].id).toBe(regularUserId);
    expect(res.body.data[0].role).toBe(UserRole.USER);
    expect(res.body.data[0]._count).toEqual({
      accounts: 1,
      transactions: 1,
      categories: 1,
    });
  });

  it('GET /api/v1/administration/users/:id - deve buscar detalhes do usuário pelo ID (200)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/administration/users/${regularUserId}`)
      .set('Cookie', adminCookie)
      .expect(200);

    expect(res.body.id).toBe(regularUserId);
    expect(res.body.name).toBe('Usuario Comum');
    expect(res.body._count).toEqual({
      accounts: 1,
      transactions: 1,
      categories: 1,
    });
  });

  it('PATCH /api/v1/administration/users/:id/role - deve atualizar o papel de um usuário (200)', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/administration/users/${regularUserId}/role`)
      .set('Cookie', adminCookie)
      .send({ role: UserRole.ADMIN })
      .expect(200);

    expect(res.body.id).toBe(regularUserId);
    expect(res.body.role).toBe(UserRole.ADMIN);

    // Confirma que no banco foi atualizado
    expect(usersDb.get(regularUserId)?.role).toBe(UserRole.ADMIN);
  });

  it('PATCH /api/v1/administration/users/:id/role - deve rejeitar auto-rebaixamento do administrador (400)', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/administration/users/${adminUserId}/role`)
      .set('Cookie', adminCookie)
      .send({ role: UserRole.USER })
      .expect(400);

    expect(res.body).toHaveProperty(
      'message',
      'Não é permitido revogar o próprio privilégio de administrador',
    );
  });
});
