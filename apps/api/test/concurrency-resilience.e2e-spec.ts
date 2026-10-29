import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { TestDatabase } from './utils/test-container.js';
import { Prisma, type PrismaClient, type User, type Account } from '@prisma/client';

describe('Concorrência, Idempotência e Resiliência (e2e)', () => {
  let prisma: PrismaClient;
  let testUser: User;

  beforeAll(async () => {
    const result = await TestDatabase.start();
    prisma = result.prisma;

    await TestDatabase.clean();

    // Cria usuário de teste para os cenários de concorrência
    testUser = await prisma.user.create({
      data: {
        name: 'Concurrency Tester',
        email: 'concurrency.test@example.com',
        passwordHash: 'hash-concurrency-test',
        role: 'USER',
      },
    });
  }, 60000);

  afterAll(async () => {
    await TestDatabase.stop();
  }, 30000);

  describe('Concorrência e Idempotência', () => {
    it('deve garantir unicidade e idempotência ao receber múltiplas criações de contas simultâneas com mesmo nome', async () => {
      const accountName = 'Reserva de Emergência Concorrente';
      const TOTAL_CONCURRENT_REQUESTS = 15;

      // Dispara 15 requisições de criação exatamente ao mesmo tempo para o mesmo usuário
      const promises = Array.from({ length: TOTAL_CONCURRENT_REQUESTS }).map(() =>
        prisma.account.create({
          data: {
            userId: testUser.id,
            name: accountName,
            type: 'SAVINGS',
            balance: 500,
          },
        })
      );

      const results = await Promise.allSettled(promises);

      const successes = results.filter((r) => r.status === 'fulfilled');
      const failures = results.filter((r) => r.status === 'rejected');

      // Exatamente 1 deve ter sido criada com sucesso
      expect(successes.length).toBe(1);
      // As outras 14 devem ter sido rejeitadas por violação de constraint única (P2002)
      expect(failures.length).toBe(TOTAL_CONCURRENT_REQUESTS - 1);

      for (const failure of failures) {
        if (failure.status === 'rejected') {
          const err = failure.reason;
          expect(err).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
          expect((err as Prisma.PrismaClientKnownRequestError).code).toBe('P2002');
        }
      }

      // No banco PostgreSQL real, deve existir apenas 1 registro
      const accountsInDb = await prisma.account.findMany({
        where: { userId: testUser.id, name: accountName },
      });
      expect(accountsInDb.length).toBe(1);
    });

    it('deve processar créditos concorrentes com atomicidade no PostgreSQL sem perda de atualização (Lost Update)', async () => {
      // 1. Cria uma conta com saldo inicial de R$ 1.000,00
      const account = await prisma.account.create({
        data: {
          userId: testUser.id,
          name: 'Conta Concorrência Saldo',
          type: 'CHECKING',
          balance: 1000,
        },
      });

      const NUM_OPERATIONS = 20;
      const CREDIT_AMOUNT = 50;

      // 2. Dispara 20 operações concorrentes atômicas incrementando o saldo
      const operations = Array.from({ length: NUM_OPERATIONS }).map(() =>
        prisma.$executeRaw`
          UPDATE accounts
          SET balance = balance + ${CREDIT_AMOUNT}, "updatedAt" = NOW()
          WHERE id = ${account.id}
        `
      );

      await Promise.all(operations);

      // 3. Valida se o saldo final é exatamente 1000 + (20 * 50) = 2000
      const updatedAccount = await prisma.account.findUniqueOrThrow({
        where: { id: account.id },
      });

      expect(Number(updatedAccount.balance)).toBe(1000 + NUM_OPERATIONS * CREDIT_AMOUNT);
    });
  });

  describe('Resiliência e Recuperação', () => {
    it('deve executar rollback completo de transação ACID quando uma etapa intermediária falha', async () => {
      const initialUsersCount = await prisma.user.count();

      const failedTransaction = prisma.$transaction(async (tx) => {
        // 1ª etapa: cria usuário dentro da transação
        await tx.user.create({
          data: {
            name: 'Temp User Rollback',
            email: 'rollback.test@example.com',
            passwordHash: 'hash-rollback',
          },
        });

        // 2ª etapa: força erro intencional para verificar abort da transação
        throw new Error('Falha simulada para verificar resiliência de rollback');
      });

      await expect(failedTransaction).rejects.toThrow(
        'Falha simulada para verificar resiliência de rollback'
      );

      // Nenhuma alteração pode ter vazado para o banco
      const finalUsersCount = await prisma.user.count();
      expect(finalUsersCount).toBe(initialUsersCount);

      const rollbackUser = await prisma.user.findUnique({
        where: { email: 'rollback.test@example.com' },
      });
      expect(rollbackUser).toBeNull();
    });

    it('deve se recuperar após desconexão temporária do pool e continuar operando normalmente', async () => {
      // 1. Simula desconexão deliberada do pool de clientes
      await prisma.$disconnect();

      // 2. Executa uma nova consulta real — o Prisma reconecta automaticamente o pool sob demanda
      const result = await prisma.$queryRaw<Array<{ health: number }>>`SELECT 1 as health;`;
      expect(result[0]?.health).toBe(1);

      // 3. Garante que operações de escrita continuam funcionando normalmente após a reconexão
      const createdCategory = await prisma.category.create({
        data: {
          userId: testUser.id,
          name: 'Categoria Resiliente',
          type: 'EXPENSE',
        },
      });

      expect(createdCategory.id).toBeDefined();
      expect(createdCategory.name).toBe('Categoria Resiliente');
    });
  });
});
