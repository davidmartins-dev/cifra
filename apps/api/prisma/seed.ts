import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('A variável de ambiente DATABASE_URL é obrigatória para executar o seed.');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const adminName = process.env.ADMIN_NAME || 'Administrador Cifra';
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@cifra.app').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';

  console.log('🌱 Iniciando seed do banco de dados...');
  console.log(`Verificando existência do administrador (${adminEmail})...`);

  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  if (!existingUser) {
    const admin = await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: UserRole.ADMIN,
      },
    });
    console.log(`✅ Administrador criado com sucesso! (ID: ${admin.id}, Email: ${admin.email})`);
  } else {
    const updated = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        role: UserRole.ADMIN,
        passwordHash,
      },
    });
    console.log(`ℹ️ Administrador existente atualizado para role ADMIN (ID: ${updated.id})`);
  }

  console.log('🌱 Seed concluído com sucesso!');
}

main()
  .catch((e: unknown) => {
    console.error('❌ Erro durante a execução do seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
