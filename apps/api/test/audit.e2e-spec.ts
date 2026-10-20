import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditLog, Prisma, User, UserRole } from '@prisma/client';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { AUTH_COOKIE_NAME } from '../src/modules/auth/jwt.strategy.js';
import { PrismaService } from '../src/shared/database/prisma.service.js';

type AuditLogWithUser = AuditLog & {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  } | null;
};

interface AuditLogResponse {
  data: AuditLogWithUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

describe('Audit (e2e)', () => {
  let app: INestApplication<App>;

  const usersDb = new Map<string, User>();
  const auditLogsDb = new Map<string, AuditLog>();

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
            if (u.email === where.email) {
              return u;
            }
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
      }): Promise<User> => {
        const existing = usersDb.get(where.id)!;
        const updated: User = {
          ...existing,
          ...data,
          updatedAt: new Date(),
        };
        usersDb.set(where.id, updated);
        return updated;
      },
    },
    emailVerification: {
      findUnique: async ({
        where,
      }: {
        where: { id: string };
      }): Promise<{ id: string; email: string; purpose: string; consumedAt: Date } | null> => {
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
    auditLog: {
      create: async ({
        data,
      }: {
        data: Prisma.AuditLogCreateInput | Prisma.AuditLogUncheckedCreateInput;
      }): Promise<AuditLog> => {
        const id = `audit-uuid-${auditLogsDb.size + 1}`;
        const userId = 'userId' in data ? (data.userId ?? null) : null;
        const record: AuditLog = {
          id,
          userId,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId ?? null,
          details: (data.details as Prisma.JsonValue) ?? null,
          ipAddress: data.ipAddress ?? null,
          userAgent: data.userAgent ?? null,
          createdAt: new Date(),
        };
        auditLogsDb.set(id, record);
        return record;
      },
      count: async ({
        where,
      }: {
        where?: Prisma.AuditLogWhereInput;
      }): Promise<number> => {
        let results = Array.from(auditLogsDb.values());

        if (where?.userId) {
          results = results.filter((log) => log.userId === where.userId);
        }
        if (where?.action) {
          if (typeof where.action === 'string') {
            results = results.filter((log) => log.action === where.action);
          } else if (typeof where.action.contains === 'string') {
            const query = where.action.contains.toLowerCase();
            results = results.filter((log) => log.action.toLowerCase().includes(query));
          }
        }
        if (where?.resource) {
          if (typeof where.resource === 'string') {
            results = results.filter((log) => log.resource === where.resource);
          } else if (typeof where.resource.contains === 'string') {
            const query = where.resource.contains.toLowerCase();
            results = results.filter((log) => log.resource.toLowerCase().includes(query));
          }
        }
        if (where?.createdAt) {
          const createdAtFilter = where.createdAt as { gte?: Date; lte?: Date };
          if (createdAtFilter.gte) {
            results = results.filter((log) => log.createdAt >= createdAtFilter.gte!);
          }
          if (createdAtFilter.lte) {
            results = results.filter((log) => log.createdAt <= createdAtFilter.lte!);
          }
        }

        return results.length;
      },
      findMany: async ({
        where,
        take,
        skip,
      }: {
        where?: Prisma.AuditLogWhereInput;
        take?: number;
        skip?: number;
      }): Promise<AuditLogWithUser[]> => {
        let results = Array.from(auditLogsDb.values());

        if (where?.userId) {
          results = results.filter((log) => log.userId === where.userId);
        }
        if (where?.action) {
          if (typeof where.action === 'string') {
            results = results.filter((log) => log.action === where.action);
          } else if (typeof where.action.contains === 'string') {
            const query = where.action.contains.toLowerCase();
            results = results.filter((log) => log.action.toLowerCase().includes(query));
          }
        }
        if (where?.resource) {
          if (typeof where.resource === 'string') {
            results = results.filter((log) => log.resource === where.resource);
          } else if (typeof where.resource.contains === 'string') {
            const query = where.resource.contains.toLowerCase();
            results = results.filter((log) => log.resource.toLowerCase().includes(query));
          }
        }
        if (where?.createdAt) {
          const createdAtFilter = where.createdAt as { gte?: Date; lte?: Date };
          if (createdAtFilter.gte) {
            results = results.filter((log) => log.createdAt >= createdAtFilter.gte!);
          }
          if (createdAtFilter.lte) {
            results = results.filter((log) => log.createdAt <= createdAtFilter.lte!);
          }
        }

        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        const start = skip ?? 0;
        const end = take ? start + take : undefined;
        const paged = results.slice(start, end);

        return paged.map((log) => {
          const user = log.userId ? usersDb.get(log.userId) : null;
          return {
            ...log,
            user: user
              ? {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  role: user.role,
                }
              : null,
          };
        });
      },
      findUnique: async ({
        where,
      }: {
        where: { id: string };
      }): Promise<AuditLogWithUser | null> => {
        const log = auditLogsDb.get(where.id);
        if (!log) return null;

        const user = log.userId ? usersDb.get(log.userId) : null;
        return {
          ...log,
          user: user
            ? {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
              }
            : null,
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
  let createdLogId = '';

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

  it('Setup: cadastra Admin e Usuário Regular, e popula logs de auditoria', async () => {
    // 1. Cadastra Admin
    const resAdmin = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Administrador Chefe',
        email: 'audit-admin@example.com',
        password: 'Password123!',
        verificationTicket: 'valid-ticket-audit-admin@example.com',
      });
    expect(resAdmin.status).toBe(201);
    adminUserId = (resAdmin.body as { user: { id: string } }).user.id;

    // Atualiza role do admin para ADMIN
    const adminRecord = usersDb.get(adminUserId)!;
    adminRecord.role = UserRole.ADMIN;
    usersDb.set(adminUserId, adminRecord);

    // Login do Admin
    const loginAdminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'audit-admin@example.com', password: 'Password123!' });
    expect(loginAdminRes.status).toBe(200);

    const adminCookies = getSetCookieHeaders(loginAdminRes);
    const adminAuthCookie = adminCookies.find((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`));
    expect(adminAuthCookie).toBeDefined();
    adminCookie = adminAuthCookie!.split(';')[0];

    // 2. Cadastra Usuário Comum
    const resUser = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Usuário Comum',
        email: 'audit-user@example.com',
        password: 'Password123!',
        verificationTicket: 'valid-ticket-audit-user@example.com',
      });
    expect(resUser.status).toBe(201);
    regularUserId = (resUser.body as { user: { id: string } }).user.id;

    // Login do Usuário Comum
    const loginUserRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'audit-user@example.com', password: 'Password123!' });
    expect(loginUserRes.status).toBe(200);

    const userCookies = getSetCookieHeaders(loginUserRes);
    const userAuthCookie = userCookies.find((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`));
    expect(userAuthCookie).toBeDefined();
    regularUserCookie = userAuthCookie!.split(';')[0];

    // 3. Popula logs de auditoria
    const log1: AuditLog = {
      id: 'log-uuid-1',
      userId: adminUserId,
      action: 'AUTH_LOGIN',
      resource: 'User',
      resourceId: adminUserId,
      details: { ip: '127.0.0.1' },
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      createdAt: new Date('2026-10-20T10:00:00.000Z'),
    };
    const log2: AuditLog = {
      id: 'log-uuid-2',
      userId: adminUserId,
      action: 'USER_ROLE_UPDATED',
      resource: 'User',
      resourceId: regularUserId,
      details: { oldRole: 'USER', newRole: 'ADMIN' },
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      createdAt: new Date('2026-10-20T11:00:00.000Z'),
    };
    const log3: AuditLog = {
      id: 'log-uuid-3',
      userId: regularUserId,
      action: 'ACCOUNT_CREATED',
      resource: 'Account',
      resourceId: 'acc-uuid-1',
      details: { name: 'Conta Corrente' },
      ipAddress: '192.168.1.1',
      userAgent: 'Chrome/120.0',
      createdAt: new Date('2026-10-15T08:00:00.000Z'),
    };
    const log4: AuditLog = {
      id: 'log-uuid-4',
      userId: regularUserId,
      action: 'TRANSACTION_CREATED',
      resource: 'Transaction',
      resourceId: 'tx-uuid-1',
      details: { amount: 150.5 },
      ipAddress: '192.168.1.1',
      userAgent: 'Chrome/120.0',
      createdAt: new Date('2026-10-10T14:30:00.000Z'),
    };

    auditLogsDb.set(log1.id, log1);
    auditLogsDb.set(log2.id, log2);
    auditLogsDb.set(log3.id, log3);
    auditLogsDb.set(log4.id, log4);

    createdLogId = log1.id;
  });

  describe('GET /api/v1/audit', () => {
    it('deve retornar 401 Unauthorized para requisições sem autenticação', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/audit');
      expect(res.status).toBe(401);
    });

    it('deve retornar 403 Forbidden para usuário comum (USER)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/audit')
        .set('Cookie', regularUserCookie);
      expect(res.status).toBe(403);
    });

    it('deve retornar 200 e a listagem paginada de logs para Administrador (ADMIN)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/audit')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      const body = res.body as AuditLogResponse;
      expect(body.total).toBe(4);
      expect(body.page).toBe(1);
      expect(body.limit).toBe(20);
      expect(body.totalPages).toBe(1);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBe(4);
      expect(body.data[0].id).toBe('log-uuid-2'); // Mais recente primeiro
    });

    it('deve filtrar logs por action', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/audit?action=AUTH_LOGIN')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      const body = res.body as AuditLogResponse;
      expect(body.total).toBe(1);
      expect(body.data[0].action).toBe('AUTH_LOGIN');
    });

    it('deve filtrar logs por resource', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/audit?resource=Account')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      const body = res.body as AuditLogResponse;
      expect(body.total).toBe(1);
      expect(body.data[0].resource).toBe('Account');
    });

    it('deve filtrar logs por userId', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/audit?userId=${regularUserId}`)
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      const body = res.body as AuditLogResponse;
      expect(body.total).toBe(2);
      expect(body.data.every((log) => log.userId === regularUserId)).toBe(true);
    });

    it('deve respeitar parâmetros de paginação page e limit', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/audit?page=1&limit=2')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      const body = res.body as AuditLogResponse;
      expect(body.total).toBe(4);
      expect(body.page).toBe(1);
      expect(body.limit).toBe(2);
      expect(body.totalPages).toBe(2);
      expect(body.data.length).toBe(2);
    });
  });

  describe('GET /api/v1/audit/:id', () => {
    it('deve retornar 403 Forbidden para usuário comum (USER)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/audit/${createdLogId}`)
        .set('Cookie', regularUserCookie);
      expect(res.status).toBe(403);
    });

    it('deve retornar 200 e detalhes completos do log para Administrador (ADMIN)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/audit/${createdLogId}`)
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      const body = res.body as AuditLogWithUser;
      expect(body.id).toBe(createdLogId);
      expect(body.action).toBe('AUTH_LOGIN');
      expect(body.resource).toBe('User');
      expect(body.user).toBeDefined();
      expect(body.user?.email).toBe('audit-admin@example.com');
      expect(body.user?.role).toBe(UserRole.ADMIN);
    });

    it('deve retornar 404 Not Found para log inexistente', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/audit/non-existent-id')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(404);
      expect((res.body as { message: string }).message).toBe(
        'Registro de auditoria não encontrado',
      );
    });
  });
});
