import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import type { UsersService } from '../users/users.service.js';
import { JwtStrategy, type JwtPayload } from './jwt.strategy.js';

describe('JwtStrategy', () => {
  const mockUser = {
    id: 'user-id-1',
    name: 'David Martins',
    email: 'david@example.com',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createStrategy = () => {
    const usersService = {
      findById: vi.fn(),
    } as unknown as UsersService;

    const configService = {
      getOrThrow: vi.fn().mockReturnValue('super-secret-key-1234567890'),
    } as unknown as ConfigService;

    const strategy = new JwtStrategy(usersService, configService);
    return { strategy, usersService, configService };
  };

  it('deve validar e retornar usuário quando payload for válido', async () => {
    const { strategy, usersService } = createStrategy();
    vi.mocked(usersService.findById).mockResolvedValue(mockUser);

    const payload: JwtPayload = {
      sub: 'user-id-1',
      email: 'david@example.com',
      role: 'USER',
    };

    const result = await strategy.validate(payload);

    expect(result).toEqual(mockUser);
    expect(usersService.findById).toHaveBeenCalledWith('user-id-1');
  });

  it('deve lançar UnauthorizedException se o usuário não for encontrado', async () => {
    const { strategy, usersService } = createStrategy();
    vi.mocked(usersService.findById).mockRejectedValue(new Error('Usuário não encontrado'));

    const payload: JwtPayload = {
      sub: 'non-existing-user',
      email: 'inexistente@example.com',
      role: 'USER',
    };

    await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    expect(usersService.findById).toHaveBeenCalledWith('non-existing-user');
  });
});
