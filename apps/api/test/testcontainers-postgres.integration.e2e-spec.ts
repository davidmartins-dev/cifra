import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { TestDatabase } from './utils/test-container.js';
import type { PrismaClient } from '@prisma/client';

describe('Testcontainers PostgreSQL Integration (e2e)', () => {
  let prisma: PrismaClient;
  let databaseUrl: string;

  beforeAll(async () => {
    const result = await TestDatabase.start();
    prisma = result.prisma;
    databaseUrl = result.databaseUrl;
  }, 60000);

  afterAll(async () => {
    await TestDatabase.stop();
  }, 30000);

  it('deve subir contêiner PostgreSQL efêmero e executar migrações do Prisma com sucesso', async () => {
    expect(databaseUrl).toBeDefined();
    expect(databaseUrl).toContain('postgres://');

    // Valida conectividade real com SELECT 1
    const rawResult = await prisma.$queryRaw<Array<{ result: number }>>`SELECT 1 as result;`;
    expect(rawResult[0]?.result).toBe(1);

    // Valida que as tabelas de schema foram criadas pelas migrations
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public';
    `;
    const tableNames = tables.map((t) => t.tablename);

    expect(tableNames).toContain('users');
    expect(tableNames).toContain('accounts');
    expect(tableNames).toContain('categories');
    expect(tableNames).toContain('transactions');
    expect(tableNames).toContain('audit_logs');
    expect(tableNames).toContain('email_verifications');
    expect(tableNames).toContain('_prisma_migrations');
  });

  it('deve persistir dados reais e respeitar restrições relacionais e integridade no PostgreSQL', async () => {
    // 1. Cria usuário real
    const user = await prisma.user.create({
      data: {
        name: 'David Testcontainers',
        email: 'david.testcontainers@example.com',
        passwordHash: 'argon2-or-bcrypt-hash-simulado',
        role: 'USER',
      },
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe('david.testcontainers@example.com');

    // 2. Cria conta financeira vinculada
    const account = await prisma.account.create({
      data: {
        userId: user.id,
        name: 'Conta Corrente Real',
        type: 'CHECKING',
        balance: 1500,
      },
    });

    expect(account.id).toBeDefined();
    expect(account.userId).toBe(user.id);
    expect(Number(account.balance)).toBe(1500);

    // 3. Testa limpeza isolada do banco
    await TestDatabase.clean();

    const usersCount = await prisma.user.count();
    const accountsCount = await prisma.account.count();

    expect(usersCount).toBe(0);
    expect(accountsCount).toBe(0);
  });
});
