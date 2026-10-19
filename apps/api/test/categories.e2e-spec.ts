import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionType, type Category, type User } from '@prisma/client';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { AUTH_COOKIE_NAME } from '../src/modules/auth/jwt.strategy.js';
import { PrismaService } from '../src/shared/database/prisma.service.js';

describe('Categories (e2e)', () => {
  let app: INestApplication<App>;

  const usersDb = new Map<string, User>();
  const categoriesDb = new Map<string, Category>();

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
    category: {
      findUnique: async ({
        where,
      }: {
        where: {
          userId_name_type?: { userId: string; name: string; type: TransactionType };
          id?: string;
        };
      }): Promise<Category | null> => {
        if (where.userId_name_type) {
          for (const cat of categoriesDb.values()) {
            if (
              cat.userId === where.userId_name_type.userId &&
              cat.name === where.userId_name_type.name &&
              cat.type === where.userId_name_type.type
            ) {
              return cat;
            }
          }
        }
        if (where.id) {
          return categoriesDb.get(where.id) ?? null;
        }
        return null;
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
      findMany: async ({
        where,
      }: {
        where: { userId: string; type?: TransactionType };
        orderBy?: { createdAt: 'desc' };
      }): Promise<Category[]> => {
        const results: Category[] = [];
        for (const cat of categoriesDb.values()) {
          if (cat.userId === where.userId) {
            if (where.type && cat.type !== where.type) {
              continue;
            }
            results.push(cat);
          }
        }
        return results;
      },
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
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<Category>;
      }): Promise<Category> => {
        const existing = categoriesDb.get(where.id)!;
        const updated: Category = {
          ...existing,
          ...data,
          updatedAt: new Date(),
        };
        categoriesDb.set(where.id, updated);
        return updated;
      },
      delete: async ({ where }: { where: { id: string } }): Promise<Category> => {
        const existing = categoriesDb.get(where.id)!;
        categoriesDb.delete(where.id);
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
  let createdExpenseId = '';
  let createdIncomeId = '';

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
      .get('/api/v1/categories')
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/v1/categories')
      .send({ name: 'Alimentação', type: 'EXPENSE' })
      .expect(401);
  });

  it('POST /api/v1/categories - deve validar payload obrigatório (400)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Cookie', user1Cookie)
      .send({ name: '', type: 'EXPENSE' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Cookie', user1Cookie)
      .send({ name: 'Alimentação', type: 'INVALID_TYPE' })
      .expect(400);
  });

  it('POST /api/v1/categories - deve criar uma categoria de despesa para o User 1', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Cookie', user1Cookie)
      .send({
        name: '  Alimentação  ',
        type: 'EXPENSE',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name', 'Alimentação');
    expect(response.body).toHaveProperty('type', 'EXPENSE');

    createdExpenseId = response.body.id;
  });

  it('POST /api/v1/categories - deve retornar 409 se tentar criar com nome e tipo duplicados para o mesmo usuário', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Cookie', user1Cookie)
      .send({
        name: 'Alimentação',
        type: 'EXPENSE',
      })
      .expect(409);

    expect(response.body).toHaveProperty('message', 'Já existe uma categoria com este nome e tipo');
  });

  it('POST /api/v1/categories - deve permitir mesmo nome se o tipo for diferente (INCOME vs EXPENSE)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Cookie', user1Cookie)
      .send({
        name: 'Alimentação',
        type: 'INCOME',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name', 'Alimentação');
    expect(response.body).toHaveProperty('type', 'INCOME');

    createdIncomeId = response.body.id;
  });

  it('POST /api/v1/categories - deve permitir que User 2 crie categoria com mesmo nome e tipo de User 1 (isolamento)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Cookie', user2Cookie)
      .send({
        name: 'Alimentação',
        type: 'EXPENSE',
      })
      .expect(201);
  });

  it('GET /api/v1/categories - deve listar todas as categorias apenas do usuário autenticado', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/categories')
      .set('Cookie', user1Cookie)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);
  });

  it('GET /api/v1/categories?type=EXPENSE - deve filtrar categorias por tipo', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/categories?type=EXPENSE')
      .set('Cookie', user1Cookie)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0].type).toBe('EXPENSE');
    expect(response.body[0].name).toBe('Alimentação');
  });

  it('GET /api/v1/categories/:id - deve obter categoria por id', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/categories/${createdExpenseId}`)
      .set('Cookie', user1Cookie)
      .expect(200);

    expect(response.body).toHaveProperty('id', createdExpenseId);
    expect(response.body).toHaveProperty('name', 'Alimentação');
  });

  it('GET /api/v1/categories/:id - User 2 não pode ver a categoria de User 1 (404)', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/categories/${createdExpenseId}`)
      .set('Cookie', user2Cookie)
      .expect(404);
  });

  it('PATCH /api/v1/categories/:id - deve atualizar os dados da categoria', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/categories/${createdExpenseId}`)
      .set('Cookie', user1Cookie)
      .send({
        name: 'Restaurante',
      })
      .expect(200);

    expect(response.body.name).toBe('Restaurante');
  });

  it('PATCH /api/v1/categories/:id - User 2 não pode atualizar a categoria de User 1 (404)', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/categories/${createdExpenseId}`)
      .set('Cookie', user2Cookie)
      .send({
        name: 'Tentativa Hacked',
      })
      .expect(404);
  });

  it('PATCH /api/v1/categories/:id - deve retornar 409 se atualizar para nome/tipo já existente em outra categoria', async () => {
    // User 1 já tem createdIncomeId com nome 'Alimentação' e type 'INCOME'
    // Tenta atualizar createdExpenseId (que virou 'Restaurante' / 'EXPENSE') para 'Alimentação' / 'INCOME'
    await request(app.getHttpServer())
      .patch(`/api/v1/categories/${createdExpenseId}`)
      .set('Cookie', user1Cookie)
      .send({
        name: 'Alimentação',
        type: 'INCOME',
      })
      .expect(409);
  });

  it('DELETE /api/v1/categories/:id - User 2 não pode deletar a categoria de User 1 (404)', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/categories/${createdExpenseId}`)
      .set('Cookie', user2Cookie)
      .expect(404);
  });

  it('DELETE /api/v1/categories/:id - User 1 pode deletar sua categoria', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/api/v1/categories/${createdExpenseId}`)
      .set('Cookie', user1Cookie)
      .expect(200);

    expect(response.body).toEqual({ message: 'Categoria removida com sucesso' });

    // Confirma que agora retorna 404
    await request(app.getHttpServer())
      .get(`/api/v1/categories/${createdExpenseId}`)
      .set('Cookie', user1Cookie)
      .expect(404);
  });
});
