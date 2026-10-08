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

describe('Users (e2e)', () => {
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
        select?: Record<string, boolean>;
      }): Promise<Omit<User, 'passwordHash'>> => {
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
        const { passwordHash: _, ...publicUser } = record;
        return publicUser;
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

  const validUserPayload = {
    name: 'Carlos Oliveira',
    email: 'carlos@example.com',
    password: 'Password123!',
  };

  it('POST /api/v1/users - deve cadastrar usuário com sucesso sem iniciar sessão (sem cookie)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/users')
      .send(validUserPayload)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name', validUserPayload.name);
    expect(response.body).toHaveProperty('email', validUserPayload.email);
    expect(response.body).toHaveProperty('role', 'USER');
    expect(response.body).not.toHaveProperty('passwordHash');
    expect(response.body).not.toHaveProperty('password');

    // Garante que o endpoint /users NÃO injeta cookie de autenticação
    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
      const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
      const hasAuthCookie = cookies.some((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`));
      expect(hasAuthCookie).toBe(false);
    }
  });

  it('POST /api/v1/users - deve retornar 409 Conflict se o e-mail já estiver cadastrado', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/users')
      .send({
        name: 'Carlos Clone',
        email: '  CARLOS@example.com  ',
        password: 'OutraPassword123!',
      })
      .expect(409);

    expect(response.body).toHaveProperty('message', 'E-mail já cadastrado');
  });

  it('POST /api/v1/users - deve retornar 400 Bad Request se campos obrigatórios forem inválidos', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/users')
      .send({
        name: '',
        email: 'invalid-email',
        password: '123',
      })
      .expect(400);

    expect(response.body).toHaveProperty('message');
    expect(Array.isArray(response.body.message)).toBe(true);
  });

  it('POST /api/v1/users - deve retornar 400 Bad Request para propriedades não permitidas', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/users')
      .send({
        ...validUserPayload,
        email: 'novo@example.com',
        role: 'ADMIN',
      })
      .expect(400);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toEqual(
      expect.arrayContaining([expect.stringContaining('property role should not exist')]),
    );
  });
});
