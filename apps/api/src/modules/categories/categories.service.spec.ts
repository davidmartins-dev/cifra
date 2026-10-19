import { ConflictException, NotFoundException } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../shared/database/prisma.service.js';
import { CategoriesService } from './categories.service.js';

describe('CategoriesService', () => {
  const userId = 'user-id-1';

  it('deve criar uma categoria com sucesso', async () => {
    const mockCategory = {
      id: 'cat-1',
      name: 'Alimentação',
      type: TransactionType.EXPENSE,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const prisma = {
      category: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(mockCategory),
      },
    } as unknown as PrismaService;

    const service = new CategoriesService(prisma);
    const result = await service.create(userId, {
      name: '  Alimentação  ',
      type: TransactionType.EXPENSE,
    });

    expect(result).toEqual(mockCategory);
    expect(prisma.category.findUnique).toHaveBeenCalledWith({
      where: {
        userId_name_type: {
          userId,
          name: 'Alimentação',
          type: TransactionType.EXPENSE,
        },
      },
    });
    expect(prisma.category.create).toHaveBeenCalledWith({
      data: {
        name: 'Alimentação',
        type: TransactionType.EXPENSE,
        userId,
      },
    });
  });

  it('deve lançar ConflictException se já existir uma categoria com o mesmo nome e tipo para o usuário', async () => {
    const prisma = {
      category: {
        findUnique: vi.fn().mockResolvedValue({ id: 'existing-id', name: 'Salário', type: TransactionType.INCOME }),
      },
    } as unknown as PrismaService;

    const service = new CategoriesService(prisma);

    await expect(
      service.create(userId, { name: 'Salário', type: TransactionType.INCOME }),
    ).rejects.toThrow(ConflictException);
  });

  it('deve lançar ConflictException em caso de erro P2002 do Prisma na criação', async () => {
    const prisma = {
      category: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockRejectedValue({ code: 'P2002' }),
      },
    } as unknown as PrismaService;

    const service = new CategoriesService(prisma);

    await expect(
      service.create(userId, { name: 'Alimentação', type: TransactionType.EXPENSE }),
    ).rejects.toThrow(ConflictException);
  });

  it('deve listar todas as categorias do usuário ordenadas por criação descendente', async () => {
    const mockCategories = [
      { id: 'cat-1', name: 'Alimentação', type: TransactionType.EXPENSE, userId },
      { id: 'cat-2', name: 'Salário', type: TransactionType.INCOME, userId },
    ];

    const prisma = {
      category: {
        findMany: vi.fn().mockResolvedValue(mockCategories),
      },
    } as unknown as PrismaService;

    const service = new CategoriesService(prisma);
    const result = await service.findAll(userId);

    expect(result).toEqual(mockCategories);
    expect(prisma.category.findMany).toHaveBeenCalledWith({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('deve filtrar categorias por type quando fornecido', async () => {
    const mockCategories = [
      { id: 'cat-1', name: 'Alimentação', type: TransactionType.EXPENSE, userId },
    ];

    const prisma = {
      category: {
        findMany: vi.fn().mockResolvedValue(mockCategories),
      },
    } as unknown as PrismaService;

    const service = new CategoriesService(prisma);
    const result = await service.findAll(userId, TransactionType.EXPENSE);

    expect(result).toEqual(mockCategories);
    expect(prisma.category.findMany).toHaveBeenCalledWith({
      where: { userId, type: TransactionType.EXPENSE },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('deve buscar uma categoria por id respeitando o userId', async () => {
    const mockCategory = { id: 'cat-1', name: 'Alimentação', type: TransactionType.EXPENSE, userId };

    const prisma = {
      category: {
        findFirst: vi.fn().mockResolvedValue(mockCategory),
      },
    } as unknown as PrismaService;

    const service = new CategoriesService(prisma);
    const result = await service.findById(userId, 'cat-1');

    expect(result).toEqual(mockCategory);
    expect(prisma.category.findFirst).toHaveBeenCalledWith({
      where: { id: 'cat-1', userId },
    });
  });

  it('deve lançar NotFoundException se a categoria não for encontrada ou não pertencer ao usuário', async () => {
    const prisma = {
      category: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaService;

    const service = new CategoriesService(prisma);

    await expect(service.findById(userId, 'cat-999')).rejects.toThrow(NotFoundException);
  });

  it('deve atualizar dados da categoria com sucesso', async () => {
    const mockCategory = { id: 'cat-1', name: 'Alimentação', type: TransactionType.EXPENSE, userId };
    const updatedCategory = { ...mockCategory, name: 'Restaurante' };

    const prisma = {
      category: {
        findFirst: vi.fn().mockResolvedValue(mockCategory),
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue(updatedCategory),
      },
    } as unknown as PrismaService;

    const service = new CategoriesService(prisma);
    const result = await service.update(userId, 'cat-1', {
      name: '  Restaurante  ',
    });

    expect(result).toEqual(updatedCategory);
    expect(prisma.category.update).toHaveBeenCalledWith({
      where: { id: 'cat-1' },
      data: {
        name: 'Restaurante',
      },
    });
  });

  it('deve lançar ConflictException se atualizar nome e tipo para um já existente em outra categoria do mesmo usuário', async () => {
    const mockCategory = { id: 'cat-1', name: 'Alimentação', type: TransactionType.EXPENSE, userId };

    const prisma = {
      category: {
        findFirst: vi.fn().mockResolvedValue(mockCategory),
        findUnique: vi.fn().mockResolvedValue({ id: 'cat-2', name: 'Transporte', type: TransactionType.EXPENSE, userId }),
      },
    } as unknown as PrismaService;

    const service = new CategoriesService(prisma);

    await expect(
      service.update(userId, 'cat-1', { name: 'Transporte' }),
    ).rejects.toThrow(ConflictException);
  });

  it('deve lançar ConflictException em caso de erro P2002 do Prisma na atualização', async () => {
    const mockCategory = { id: 'cat-1', name: 'Alimentação', type: TransactionType.EXPENSE, userId };

    const prisma = {
      category: {
        findFirst: vi.fn().mockResolvedValue(mockCategory),
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockRejectedValue({ code: 'P2002' }),
      },
    } as unknown as PrismaService;

    const service = new CategoriesService(prisma);

    await expect(
      service.update(userId, 'cat-1', { name: 'Transporte' }),
    ).rejects.toThrow(ConflictException);
  });

  it('deve remover uma categoria com sucesso', async () => {
    const mockCategory = { id: 'cat-1', name: 'Alimentação', type: TransactionType.EXPENSE, userId };

    const prisma = {
      category: {
        findFirst: vi.fn().mockResolvedValue(mockCategory),
        delete: vi.fn().mockResolvedValue(mockCategory),
      },
    } as unknown as PrismaService;

    const service = new CategoriesService(prisma);
    const result = await service.remove(userId, 'cat-1');

    expect(result).toEqual({ message: 'Categoria removida com sucesso' });
    expect(prisma.category.delete).toHaveBeenCalledWith({
      where: { id: 'cat-1' },
    });
  });

  it('deve lançar ConflictException se tentar remover categoria com transações vinculadas (erro P2003)', async () => {
    const mockCategory = { id: 'cat-1', name: 'Alimentação', type: TransactionType.EXPENSE, userId };

    const prisma = {
      category: {
        findFirst: vi.fn().mockResolvedValue(mockCategory),
        delete: vi.fn().mockRejectedValue({ code: 'P2003' }),
      },
    } as unknown as PrismaService;

    const service = new CategoriesService(prisma);

    await expect(service.remove(userId, 'cat-1')).rejects.toThrow(ConflictException);
  });
});
