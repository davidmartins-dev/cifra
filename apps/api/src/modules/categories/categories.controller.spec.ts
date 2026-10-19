import { TransactionType } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { CategoriesController } from './categories.controller.js';
import type { CategoriesService } from './categories.service.js';

describe('CategoriesController', () => {
  const userId = 'user-1';

  it('deve delegar a criação de categoria para o CategoriesService', async () => {
    const mockCategory = {
      id: 'cat-1',
      name: 'Alimentação',
      type: TransactionType.EXPENSE,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const service = {
      create: vi.fn().mockResolvedValue(mockCategory),
    } as unknown as CategoriesService;

    const controller = new CategoriesController(service);
    const dto = { name: 'Alimentação', type: TransactionType.EXPENSE };

    const result = await controller.create(userId, dto);

    expect(service.create).toHaveBeenCalledWith(userId, dto);
    expect(result).toEqual(mockCategory);
  });

  it('deve delegar a listagem de categorias para o CategoriesService', async () => {
    const mockCategories = [{ id: 'cat-1', name: 'Alimentação', type: TransactionType.EXPENSE, userId }];

    const service = {
      findAll: vi.fn().mockResolvedValue(mockCategories),
    } as unknown as CategoriesService;

    const controller = new CategoriesController(service);
    const result = await controller.findAll(userId, undefined);

    expect(service.findAll).toHaveBeenCalledWith(userId, undefined);
    expect(result).toEqual(mockCategories);
  });

  it('deve delegar a listagem filtrada por tipo para o CategoriesService', async () => {
    const mockCategories = [{ id: 'cat-1', name: 'Salário', type: TransactionType.INCOME, userId }];

    const service = {
      findAll: vi.fn().mockResolvedValue(mockCategories),
    } as unknown as CategoriesService;

    const controller = new CategoriesController(service);
    const result = await controller.findAll(userId, TransactionType.INCOME);

    expect(service.findAll).toHaveBeenCalledWith(userId, TransactionType.INCOME);
    expect(result).toEqual(mockCategories);
  });

  it('deve delegar a busca por id para o CategoriesService', async () => {
    const mockCategory = { id: 'cat-1', name: 'Alimentação', type: TransactionType.EXPENSE, userId };

    const service = {
      findById: vi.fn().mockResolvedValue(mockCategory),
    } as unknown as CategoriesService;

    const controller = new CategoriesController(service);
    const result = await controller.findOne(userId, 'cat-1');

    expect(service.findById).toHaveBeenCalledWith(userId, 'cat-1');
    expect(result).toEqual(mockCategory);
  });

  it('deve delegar a atualização para o CategoriesService', async () => {
    const mockCategory = { id: 'cat-1', name: 'Restaurante', type: TransactionType.EXPENSE, userId };

    const service = {
      update: vi.fn().mockResolvedValue(mockCategory),
    } as unknown as CategoriesService;

    const controller = new CategoriesController(service);
    const dto = { name: 'Restaurante' };

    const result = await controller.update(userId, 'cat-1', dto);

    expect(service.update).toHaveBeenCalledWith(userId, 'cat-1', dto);
    expect(result).toEqual(mockCategory);
  });

  it('deve delegar a remoção para o CategoriesService', async () => {
    const mockResponse = { message: 'Categoria removida com sucesso' };

    const service = {
      remove: vi.fn().mockResolvedValue(mockResponse),
    } as unknown as CategoriesService;

    const controller = new CategoriesController(service);
    const result = await controller.remove(userId, 'cat-1');

    expect(service.remove).toHaveBeenCalledWith(userId, 'cat-1');
    expect(result).toEqual(mockResponse);
  });
});
