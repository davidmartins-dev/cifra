import { ConflictException, NotFoundException } from '@nestjs/common';
import { AccountType } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../shared/database/prisma.service.js';
import { AccountsService } from './accounts.service.js';

describe('AccountsService', () => {
  const userId = 'user-id-1';

  it('deve criar uma conta financeira com sucesso', async () => {
    const mockAccount = {
      id: 'acc-1',
      name: 'Nubank',
      type: AccountType.CHECKING,
      balance: 150.0,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const prisma = {
      account: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(mockAccount),
      },
    } as unknown as PrismaService;

    const service = new AccountsService(prisma);
    const result = await service.create(userId, {
      name: '  Nubank  ',
      type: AccountType.CHECKING,
      balance: 150.0,
    });

    expect(result).toEqual(mockAccount);
    expect(prisma.account.findUnique).toHaveBeenCalledWith({
      where: {
        userId_name: {
          userId,
          name: 'Nubank',
        },
      },
    });
    expect(prisma.account.create).toHaveBeenCalledWith({
      data: {
        name: 'Nubank',
        type: AccountType.CHECKING,
        balance: 150.0,
        userId,
      },
    });
  });

  it('deve criar conta com type CHECKING e balance 0 por padrão se omitidos', async () => {
    const mockAccount = {
      id: 'acc-1',
      name: 'Carteira',
      type: AccountType.CHECKING,
      balance: 0,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const prisma = {
      account: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(mockAccount),
      },
    } as unknown as PrismaService;

    const service = new AccountsService(prisma);
    await service.create(userId, { name: 'Carteira' });

    expect(prisma.account.create).toHaveBeenCalledWith({
      data: {
        name: 'Carteira',
        type: AccountType.CHECKING,
        balance: 0,
        userId,
      },
    });
  });

  it('deve lançar ConflictException se já existir uma conta com o mesmo nome para o usuário', async () => {
    const prisma = {
      account: {
        findUnique: vi.fn().mockResolvedValue({ id: 'existing-id', name: 'Nubank' }),
      },
    } as unknown as PrismaService;

    const service = new AccountsService(prisma);

    await expect(service.create(userId, { name: 'Nubank' })).rejects.toThrow(ConflictException);
  });

  it('deve lançar ConflictException em caso de erro P2002 do Prisma', async () => {
    const prisma = {
      account: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockRejectedValue({ code: 'P2002' }),
      },
    } as unknown as PrismaService;

    const service = new AccountsService(prisma);

    await expect(service.create(userId, { name: 'Nubank' })).rejects.toThrow(ConflictException);
  });

  it('deve listar todas as contas do usuário ordenadas por criação descendente', async () => {
    const mockAccounts = [
      { id: 'acc-1', name: 'Nubank', userId },
      { id: 'acc-2', name: 'Itaú', userId },
    ];

    const prisma = {
      account: {
        findMany: vi.fn().mockResolvedValue(mockAccounts),
      },
    } as unknown as PrismaService;

    const service = new AccountsService(prisma);
    const result = await service.findAll(userId);

    expect(result).toEqual(mockAccounts);
    expect(prisma.account.findMany).toHaveBeenCalledWith({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('deve buscar uma conta por id respeitando o userId', async () => {
    const mockAccount = { id: 'acc-1', name: 'Nubank', userId };

    const prisma = {
      account: {
        findFirst: vi.fn().mockResolvedValue(mockAccount),
      },
    } as unknown as PrismaService;

    const service = new AccountsService(prisma);
    const result = await service.findById(userId, 'acc-1');

    expect(result).toEqual(mockAccount);
    expect(prisma.account.findFirst).toHaveBeenCalledWith({
      where: { id: 'acc-1', userId },
    });
  });

  it('deve lançar NotFoundException se a conta não for encontrada ou não pertencer ao usuário', async () => {
    const prisma = {
      account: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaService;

    const service = new AccountsService(prisma);

    await expect(service.findById(userId, 'acc-999')).rejects.toThrow(NotFoundException);
  });

  it('deve atualizar dados da conta com sucesso', async () => {
    const mockAccount = { id: 'acc-1', name: 'Nubank', type: AccountType.CHECKING, balance: 100, userId };
    const updatedAccount = { ...mockAccount, name: 'Nubank PJ', balance: 500 };

    const prisma = {
      account: {
        findFirst: vi.fn().mockResolvedValue(mockAccount),
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue(updatedAccount),
      },
    } as unknown as PrismaService;

    const service = new AccountsService(prisma);
    const result = await service.update(userId, 'acc-1', {
      name: 'Nubank PJ',
      balance: 500,
    });

    expect(result).toEqual(updatedAccount);
    expect(prisma.account.update).toHaveBeenCalledWith({
      where: { id: 'acc-1' },
      data: {
        name: 'Nubank PJ',
        balance: 500,
      },
    });
  });

  it('deve lançar ConflictException se atualizar o nome para um já existente em outra conta do mesmo usuário', async () => {
    const mockAccount = { id: 'acc-1', name: 'Nubank', userId };

    const prisma = {
      account: {
        findFirst: vi.fn().mockResolvedValue(mockAccount),
        findUnique: vi.fn().mockResolvedValue({ id: 'acc-2', name: 'Itaú', userId }),
      },
    } as unknown as PrismaService;

    const service = new AccountsService(prisma);

    await expect(service.update(userId, 'acc-1', { name: 'Itaú' })).rejects.toThrow(ConflictException);
  });

  it('deve remover uma conta com sucesso', async () => {
    const mockAccount = { id: 'acc-1', name: 'Nubank', userId };

    const prisma = {
      account: {
        findFirst: vi.fn().mockResolvedValue(mockAccount),
        delete: vi.fn().mockResolvedValue(mockAccount),
      },
    } as unknown as PrismaService;

    const service = new AccountsService(prisma);
    const result = await service.remove(userId, 'acc-1');

    expect(result).toEqual({ message: 'Conta removida com sucesso' });
    expect(prisma.account.delete).toHaveBeenCalledWith({
      where: { id: 'acc-1' },
    });
  });
});
