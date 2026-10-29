import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { AUTH_COOKIE_NAME } from '../src/modules/auth/jwt.strategy.js';
import { TestDatabase } from './utils/test-container.js';
import type { PrismaClient } from '@prisma/client';

describe('API Real E2E - PostgreSQL com Testcontainers (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;
  let authCookie: string;
  let userId: string;
  let accountId: string;
  let incomeCategoryId: string;
  let expenseCategoryId: string;

  beforeAll(async () => {
    // 1. Inicia o contêiner real de PostgreSQL e executa migrações
    const testDb = await TestDatabase.start();
    prisma = testDb.prisma;
    await TestDatabase.clean();

    // 2. Inicializa a aplicação NestJS conectada diretamente ao banco real (sem mocks)
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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
  }, 60000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    await TestDatabase.stop();
  }, 30000);

  describe('1. Fluxo Completo de Autenticação e Usuário no PostgreSQL', () => {
    const userEmail = 'david.real.db@cifra.com';
    const userPassword = 'Password@123';
    let verificationTicket: string;

    it('deve gerar ticket de verificação de e-mail e salvar no banco real', async () => {
      // Cria verificação direto no banco simulando ticket consumido válido
      const verification = await prisma.emailVerification.create({
        data: {
          email: userEmail,
          codeHash: 'hash-simulado',
          purpose: 'SIGNUP',
          consumedAt: new Date(),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      verificationTicket = verification.id;
      expect(verificationTicket).toBeDefined();
    });

    it('deve registrar usuário no banco de dados real via endpoint /auth/register', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'David Real Database',
          email: userEmail,
          password: userPassword,
          verificationTicket,
        })
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(userEmail);
      expect(response.body.user.name).toBe('David Real Database');
      userId = response.body.user.id;

      // Valida persistência real no PostgreSQL
      const userInDb = await prisma.user.findUnique({ where: { id: userId } });
      expect(userInDb).not.toBeNull();
      expect(userInDb?.email).toBe(userEmail);
    });

    it('deve autenticar com sucesso via /auth/login e emitir cookie JWT', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: userEmail,
          password: userPassword,
        })
        .expect(200);

      const cookies = response.headers['set-cookie'] as unknown as string[] | undefined;
      expect(cookies).toBeDefined();

      const authCookieHeader = cookies?.find((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`));
      expect(authCookieHeader).toBeDefined();
      authCookie = authCookieHeader!.split(';')[0]!;
    });

    it('deve retornar o perfil do usuário logado via /auth/me usando o cookie', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe(userId);
      expect(response.body.user.email).toBe(userEmail);
    });
  });

  describe('2. Gestão de Contas Financeiras no PostgreSQL', () => {
    it('deve criar uma conta bancária vinculada ao usuário no PostgreSQL', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/accounts')
        .set('Cookie', authCookie)
        .send({
          name: 'Nubank Principal',
          type: 'CHECKING',
          balance: 2500,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Nubank Principal');
      expect(Number(response.body.balance)).toBe(2500);
      accountId = response.body.id;

      // Validação no banco real
      const accountInDb = await prisma.account.findUnique({ where: { id: accountId } });
      expect(accountInDb).not.toBeNull();
      expect(accountInDb?.userId).toBe(userId);
    });

    it('deve retornar erro 409 ao tentar duplicar o nome da conta para o mesmo usuário (Unicidade real)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/accounts')
        .set('Cookie', authCookie)
        .send({
          name: 'Nubank Principal',
          type: 'CHECKING',
          balance: 100,
        })
        .expect(409);
    });

    it('deve listar as contas do usuário logado', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/accounts')
        .set('Cookie', authCookie)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0].id).toBe(accountId);
    });
  });

  describe('3. Categorias e Transações Financeiras no PostgreSQL', () => {
    it('deve criar categorias de receita e despesa no PostgreSQL', async () => {
      const incomeRes = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Cookie', authCookie)
        .send({
          name: 'Salário Real',
          type: 'INCOME',
        })
        .expect(201);
      incomeCategoryId = incomeRes.body.id;

      const expenseRes = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Cookie', authCookie)
        .send({
          name: 'Alimentação Real',
          type: 'EXPENSE',
        })
        .expect(201);
      expenseCategoryId = expenseRes.body.id;

      expect(incomeCategoryId).toBeDefined();
      expect(expenseCategoryId).toBeDefined();
    });

    it('deve registrar transações de receita e despesa associadas a conta e categoria reais', async () => {
      // 1. Receita de R$ 5.000,00
      await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .set('Cookie', authCookie)
        .send({
          description: 'Salário Mensal',
          amount: 5000,
          type: 'INCOME',
          date: new Date().toISOString(),
          accountId,
          categoryId: incomeCategoryId,
        })
        .expect(201);

      // 2. Despesa de R$ 1.200,00
      await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .set('Cookie', authCookie)
        .send({
          description: 'Supermercado Mensal',
          amount: 1200,
          type: 'EXPENSE',
          date: new Date().toISOString(),
          accountId,
          categoryId: expenseCategoryId,
        })
        .expect(201);

      const transactionsInDb = await prisma.transaction.findMany({ where: { userId } });
      expect(transactionsInDb.length).toBe(2);
    });
  });

  describe('4. Resumo Financeiro (Financial Summary) com Agregação SQL Real', () => {
    it('deve calcular o resumo financeiro real com base nas transações persistidas', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/financial-summary/overview')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body).toHaveProperty('currentBalance');
      expect(response.body).toHaveProperty('totalIncome');
      expect(response.body).toHaveProperty('totalExpense');
      expect(Number(response.body.totalIncome)).toBe(5000);
      expect(Number(response.body.totalExpense)).toBe(1200);
      expect(Number(response.body.netBalance)).toBe(3800);
    });

    it('deve agrupar gastos por categoria com consultas relacionais reais', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/financial-summary/by-category?type=EXPENSE')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body).toHaveProperty('categories');
      expect(Array.isArray(response.body.categories)).toBe(true);
      const foodCategory = response.body.categories.find(
        (c: { categoryId: string }) => c.categoryId === expenseCategoryId,
      );
      expect(foodCategory).toBeDefined();
      expect(Number(foodCategory.amount)).toBe(1200);
    });
  });

  describe('5. Isolamento Multilocatário (Tenant Isolation) e Filtros Avançados no PostgreSQL', () => {
    let otherAuthCookie: string;
    let otherUserId: string;

    it('deve registrar um segundo usuário para teste de isolamento multilocatário', async () => {
      const otherEmail = 'other.tenant@cifra.com';
      const verification = await prisma.emailVerification.create({
        data: {
          email: otherEmail,
          codeHash: 'hash-code-654321',
          purpose: 'SIGNUP',
          consumedAt: new Date(),
          expiresAt: new Date(Date.now() + 1000 * 60 * 15),
        },
      });

      const registerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Outro Inquilino',
          email: otherEmail,
          password: 'Password@123',
          verificationTicket: verification.id,
        })
        .expect(201);

      otherUserId = registerRes.body.user.id;
      const cookies = registerRes.headers['set-cookie'];
      otherAuthCookie = Array.isArray(cookies) ? cookies[0] ?? '' : cookies || '';
      expect(otherAuthCookie).toContain(AUTH_COOKIE_NAME);
    });

    it('não deve permitir que o segundo usuário acerte ou visualize recursos do primeiro usuário', async () => {
      // Usuário 2 tenta consultar a conta do Usuário 1
      await request(app.getHttpServer())
        .get(`/api/v1/accounts/${accountId}`)
        .set('Cookie', otherAuthCookie)
        .expect(404);

      // Usuário 2 não deve enxergar as transações do Usuário 1
      const res = await request(app.getHttpServer())
        .get('/api/v1/transactions')
        .set('Cookie', otherAuthCookie)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it('deve filtrar transações por tipo, conta e limites no PostgreSQL real', async () => {
      const incomeFilterRes = await request(app.getHttpServer())
        .get(`/api/v1/transactions?type=INCOME&accountId=${accountId}`)
        .set('Cookie', authCookie)
        .expect(200);

      expect(Array.isArray(incomeFilterRes.body)).toBe(true);
      expect(incomeFilterRes.body.length).toBe(1);
      expect(incomeFilterRes.body[0].type).toBe('INCOME');
      expect(incomeFilterRes.body[0].accountId).toBe(accountId);
    });

    afterAll(async () => {
      if (otherUserId) {
        await prisma.user.deleteMany({ where: { id: otherUserId } });
      }
    });
  });

  describe('6. Painel Administrativo e Auditoria (RBAC) com Roles no Banco Real', () => {
    let adminAuthCookie: string;
    let adminUserId: string;

    it('deve rejeitar acesso com 403 Forbidden para usuário comum em rotas administrativas', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/administration/users')
        .set('Cookie', authCookie)
        .expect(403);

      await request(app.getHttpServer())
        .get('/api/v1/audit')
        .set('Cookie', authCookie)
        .expect(403);
    });

    it('deve permitir acesso completo a rotas administrativas para usuário com ROLE ADMIN', async () => {
      const adminEmail = 'super.admin@cifra.com';
      const verification = await prisma.emailVerification.create({
        data: {
          email: adminEmail,
          codeHash: 'hash-code-999888',
          purpose: 'SIGNUP',
          consumedAt: new Date(),
          expiresAt: new Date(Date.now() + 1000 * 60 * 15),
        },
      });

      const registerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Super Administrador',
          email: adminEmail,
          password: 'Password@123',
          verificationTicket: verification.id,
        })
        .expect(201);

      adminUserId = registerRes.body.user.id;
      // Promove diretamente no PostgreSQL real para role ADMIN
      await prisma.user.update({
        where: { id: adminUserId },
        data: { role: 'ADMIN' },
      });

      // Login para emitir cookie com a nova role
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: adminEmail,
          password: 'Password@123',
        })
        .expect(200);

      const cookies = loginRes.headers['set-cookie'];
      adminAuthCookie = Array.isArray(cookies) ? cookies[0] ?? '' : cookies || '';

      const adminUsersRes = await request(app.getHttpServer())
        .get('/api/v1/administration/users')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(adminUsersRes.body).toHaveProperty('data');
      expect(Array.isArray(adminUsersRes.body.data)).toBe(true);
      expect(adminUsersRes.body.data.length).toBeGreaterThanOrEqual(1);
      expect(adminUsersRes.body).toHaveProperty('meta');

      // Consulta logs de auditoria
      await prisma.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'E2E_AUDIT_TEST',
          resource: 'User',
          resourceId: adminUserId,
        },
      });

      const auditRes = await request(app.getHttpServer())
        .get('/api/v1/audit')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(auditRes.body).toHaveProperty('data');
      expect(Array.isArray(auditRes.body.data)).toBe(true);
    });

    afterAll(async () => {
      if (adminUserId) {
        await prisma.user.deleteMany({ where: { id: adminUserId } });
      }
    });
  });

  describe('7. Integridade Relacional e Exclusão em Cascata (ON DELETE CASCADE)', () => {
    it('deve excluir o usuário e garantir que contas, categorias e transações são removidas em cascata pelo PostgreSQL', async () => {
      expect(userId).toBeDefined();

      // Exclui o usuário diretamente no PostgreSQL
      await prisma.user.delete({ where: { id: userId } });

      // Valida que o PostgreSQL executou o CASCADE em todas as tabelas relacionadas
      const accountsCount = await prisma.account.count({ where: { userId } });
      const categoriesCount = await prisma.category.count({ where: { userId } });
      const transactionsCount = await prisma.transaction.count({ where: { userId } });

      expect(accountsCount).toBe(0);
      expect(categoriesCount).toBe(0);
      expect(transactionsCount).toBe(0);
    });
  });
});
