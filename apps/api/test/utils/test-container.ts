import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'node:child_process';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

export class TestDatabase {
  private static container: StartedPostgreSqlContainer | null = null;
  private static prismaClient: PrismaClient | null = null;
  private static databaseUrl: string | null = null;

  static async start(): Promise<{
    container: StartedPostgreSqlContainer;
    databaseUrl: string;
    prisma: PrismaClient;
  }> {
    if (!this.container) {
      this.container = await new PostgreSqlContainer('postgres:16-alpine')
        .withDatabase('cifra_test')
        .withUsername('postgres')
        .withPassword('postgres')
        .start();

      this.databaseUrl = this.container.getConnectionUri();
      process.env.DATABASE_URL = this.databaseUrl;

      // Executa as migrações reais do Prisma dentro do contêiner PostgreSQL efêmero
      execSync('npx prisma migrate deploy', {
        cwd: process.cwd(),
        env: {
          ...process.env,
          DATABASE_URL: this.databaseUrl,
        },
        stdio: 'pipe',
      });

      const adapter = new PrismaPg({ connectionString: this.databaseUrl });
      this.prismaClient = new PrismaClient({ adapter });
      await this.prismaClient.$connect();
    }

    return {
      container: this.container,
      databaseUrl: this.databaseUrl!,
      prisma: this.prismaClient!,
    };
  }

  static getPrisma(): PrismaClient {
    if (!this.prismaClient) {
      throw new Error('TestDatabase not started. Call TestDatabase.start() first.');
    }
    return this.prismaClient;
  }

  static getDatabaseUrl(): string {
    if (!this.databaseUrl) {
      throw new Error('TestDatabase not started. Call TestDatabase.start() first.');
    }
    return this.databaseUrl;
  }

  static async clean(): Promise<void> {
    if (!this.prismaClient) return;

    const tables = await this.prismaClient.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename != '_prisma_migrations';
    `;

    for (const { tablename } of tables) {
      await this.prismaClient.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
    }
  }

  static async stop(): Promise<void> {
    if (this.prismaClient) {
      await this.prismaClient.$disconnect();
      this.prismaClient = null;
    }
    if (this.container) {
      await this.container.stop();
      this.container = null;
      this.databaseUrl = null;
    }
  }
}
