import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { User } from '@prisma/client';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { AUTH_COOKIE_NAME } from '../src/modules/auth/jwt.strategy.js';
import { PrismaService } from '../src/shared/database/prisma.service.js';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  const usersDb = new Map<string, User>();

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

  const testUser = {
    name: 'David Martins',
    email: 'david.e2e@example.com',
    password: 'Password123!',
  };

  let authCookie = '';

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

  it('POST /api/v1/auth/register - deve cadastrar usuário e retornar cookie HttpOnly', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(201);

    expect(response.body).toHaveProperty('message', 'Cadastro realizado com sucesso');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user.email).toBe(testUser.email.toLowerCase());
    expect(response.body.user).not.toHaveProperty('passwordHash');

    const cookies = getSetCookieHeaders(response);
    const tokenCookie = cookies.find((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`));
    expect(tokenCookie).toBeDefined();
    expect(tokenCookie).toContain('HttpOnly');

    if (tokenCookie) {
      authCookie = tokenCookie.split(';')[0];
    }
  });

  it('GET /api/v1/auth/me - deve retornar dados do usuário autenticado via cookie', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Cookie', authCookie)
      .expect(200);

    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe(testUser.email.toLowerCase());
  });

  it('GET /api/v1/auth/me - deve rejeitar acesso sem token/cookie (401)', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .expect(401);
  });

  it('POST /api/v1/auth/login - deve realizar login com sucesso e renovar cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    expect(response.body).toHaveProperty('message', 'Login realizado com sucesso');
    expect(response.body.user.email).toBe(testUser.email.toLowerCase());

    const cookies = getSetCookieHeaders(response);
    const tokenCookie = cookies.find((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`));
    expect(tokenCookie).toBeDefined();

    if (tokenCookie) {
      authCookie = tokenCookie.split(';')[0];
    }
  });

  it('POST /api/v1/auth/logout - deve limpar o cookie de autenticação', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', authCookie)
      .expect(200);

    expect(response.body).toEqual({ message: 'Sessão encerrada com sucesso' });

    const cookies = getSetCookieHeaders(response);
    const tokenCookie = cookies.find((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`));
    expect(tokenCookie).toBeDefined();
    expect(tokenCookie).toMatch(/Expires=Thu, 01 Jan 1970|Max-Age=0/i);
  });
});
