import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AccountType, type Account, type User } from '@prisma/client';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { AUTH_COOKIE_NAME } from '../src/modules/auth/jwt.strategy.js';
import { PrismaService } from '../src/shared/database/prisma.service.js';

describe('Accounts (e2e)', () => {
  let app: INestApplication<App>;

  const usersDb = new Map<string, User>();
  const accountsDb = new Map<string, Account>();

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
      findUnique: async ({
        where,
      }: {
        where: { userId_name?: { userId: string; name: string }; id?: string };
      }): Promise<Account | null> => {
        if (where.userId_name) {
          for (const acc of accountsDb.values()) {
            if (acc.userId === where.userId_name.userId && acc.name === where.userId_name.name) {
              return acc;
            }
          }
        }
        if (where.id) {
          return accountsDb.get(where.id) ?? null;
        }
        return null;
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
      findMany: async ({
        where,
      }: {
        where: { userId: string };
        orderBy?: { createdAt: 'desc' };
      }): Promise<Account[]> => {
        const results: Account[] = [];
        for (const acc of accountsDb.values()) {
          if (acc.userId === where.userId) {
            results.push(acc);
          }
        }
        return results;
      },
      create: async ({
        data,
      }: {
        data: { name: string; type: AccountType; balance: number; userId: string };
      }): Promise<Account> => {
        const id = `acc-uuid-${accountsDb.size + 1}`;
        const record = {
          id,
          name: data.name,
          type: data.type,
          balance: data.balance as unknown as any,
          userId: data.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Account;
        accountsDb.set(id, record);
        return record;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<Account>;
      }): Promise<Account> => {
        const existing = accountsDb.get(where.id)!;
        const updated = {
          ...existing,
          ...data,
          updatedAt: new Date(),
        };
        accountsDb.set(where.id, updated);
        return updated;
      },
      delete: async ({ where }: { where: { id: string } }): Promise<Account> => {
        const existing = accountsDb.get(where.id)!;
        accountsDb.delete(where.id);
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
  let createdAccountId = '';

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
  });

  it('deve rejeitar acesso sem autenticação (401)', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/accounts')
      .expect(401);
  });

  it('POST /api/v1/accounts - deve criar uma conta financeira para o User 1', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/accounts')
      .set('Cookie', user1Cookie)
      .send({
        name: 'Nubank',
        type: 'CHECKING',
        balance: 1500.5,
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name', 'Nubank');
    expect(response.body).toHaveProperty('type', 'CHECKING');
    expect(response.body).toHaveProperty('balance', 1500.5);

    createdAccountId = response.body.id;
  });

  it('POST /api/v1/accounts - deve retornar 409 se tentar criar com nome duplicado para o mesmo usuário', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/accounts')
      .set('Cookie', user1Cookie)
      .send({
        name: 'Nubank',
        type: 'SAVINGS',
      })
      .expect(409);

    expect(response.body).toHaveProperty('message', 'Já existe uma conta com este nome');
  });

  it('POST /api/v1/accounts - deve permitir que User 2 crie conta com o mesmo nome de User 1 (isolamento)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/accounts')
      .set('Cookie', user2Cookie)
      .send({
        name: 'Nubank',
        type: 'CHECKING',
      })
      .expect(201);
  });

  it('GET /api/v1/accounts - deve listar apenas as contas do usuário autenticado', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/accounts')
      .set('Cookie', user1Cookie)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0].name).toBe('Nubank');
  });

  it('GET /api/v1/accounts/:id - deve obter conta por id', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/accounts/${createdAccountId}`)
      .set('Cookie', user1Cookie)
      .expect(200);

    expect(response.body).toHaveProperty('id', createdAccountId);
    expect(response.body).toHaveProperty('name', 'Nubank');
  });

  it('GET /api/v1/accounts/:id - User 2 não pode ver a conta de User 1 (404)', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/accounts/${createdAccountId}`)
      .set('Cookie', user2Cookie)
      .expect(404);
  });

  it('PATCH /api/v1/accounts/:id - deve atualizar os dados da conta', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/accounts/${createdAccountId}`)
      .set('Cookie', user1Cookie)
      .send({
        name: 'Nubank Principal',
        balance: 2000,
      })
      .expect(200);

    expect(response.body.name).toBe('Nubank Principal');
    expect(response.body.balance).toBe(2000);
  });

  it('PATCH /api/v1/accounts/:id - User 2 não pode atualizar a conta de User 1 (404)', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/accounts/${createdAccountId}`)
      .set('Cookie', user2Cookie)
      .send({
        name: 'Hacked',
      })
      .expect(404);
  });

  it('DELETE /api/v1/accounts/:id - User 2 não pode deletar a conta de User 1 (404)', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/accounts/${createdAccountId}`)
      .set('Cookie', user2Cookie)
      .expect(404);
  });

  it('DELETE /api/v1/accounts/:id - User 1 pode deletar sua conta', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/api/v1/accounts/${createdAccountId}`)
      .set('Cookie', user1Cookie)
      .expect(200);

    expect(response.body).toEqual({ message: 'Conta removida com sucesso' });
  });
});
