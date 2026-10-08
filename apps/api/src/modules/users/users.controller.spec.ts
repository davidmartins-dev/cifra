import { describe, expect, it, vi } from 'vitest';
import { UsersController } from './users.controller.js';
import type { UsersService } from './users.service.js';

describe('UsersController', () => {
  it('deve delegar a criação do usuário para o UsersService', async () => {
    const mockUser = {
      id: 'user-id-1',
      name: 'David Martins',
      email: 'david@example.com',
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const usersService = {
      create: vi.fn().mockResolvedValue(mockUser),
    } as unknown as UsersService;

    const controller = new UsersController(usersService);

    const dto = {
      name: 'David Martins',
      email: 'david@example.com',
      password: 'password123',
    };

    const result = await controller.create(dto);

    expect(usersService.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockUser);
  });
});
