import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { describe, expect, it, vi } from 'vitest';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  it('deve realizar login com sucesso com credenciais válidas', async () => {
    const mockUser = {
      id: 'user-1',
      name: 'David Martins',
      email: 'david@example.com',
      passwordHash: 'hashed_password',
      role: 'USER' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const usersService = {
      findByEmail: vi.fn().mockResolvedValue(mockUser),
    } as unknown as UsersService;

    const jwtService = {
      sign: vi.fn().mockReturnValue('mock-jwt-token'),
    } as unknown as JwtService;

    vi.spyOn(bcrypt, 'compare').mockImplementation(async () => true);

    const service = new AuthService(usersService, jwtService);
    const result = await service.login({
      email: 'david@example.com',
      password: 'password123',
    });

    expect(result.accessToken).toBe('mock-jwt-token');
    expect(result.user.email).toBe('david@example.com');
    expect(usersService.findByEmail).toHaveBeenCalledWith('david@example.com');
  });

  it('deve lançar UnauthorizedException se o usuário não for encontrado no login', async () => {
    const usersService = {
      findByEmail: vi.fn().mockResolvedValue(null),
    } as unknown as UsersService;

    const jwtService = {
      sign: vi.fn(),
    } as unknown as JwtService;

    const service = new AuthService(usersService, jwtService);

    await expect(
      service.login({
        email: 'inexistente@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('deve lançar UnauthorizedException se a senha for incorreta no login', async () => {
    const mockUser = {
      id: 'user-1',
      name: 'David Martins',
      email: 'david@example.com',
      passwordHash: 'hashed_password',
      role: 'USER' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const usersService = {
      findByEmail: vi.fn().mockResolvedValue(mockUser),
    } as unknown as UsersService;

    const jwtService = {
      sign: vi.fn(),
    } as unknown as JwtService;

    vi.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

    const service = new AuthService(usersService, jwtService);

    await expect(
      service.login({
        email: 'david@example.com',
        password: 'wrongpassword',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('deve registrar usuário e retornar token de acesso', async () => {
    const createdUser = {
      id: 'user-2',
      name: 'Novo Usuário',
      email: 'novo@example.com',
      role: 'USER' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const usersService = {
      create: vi.fn().mockResolvedValue(createdUser),
    } as unknown as UsersService;

    const jwtService = {
      sign: vi.fn().mockReturnValue('mock-jwt-token'),
    } as unknown as JwtService;

    const service = new AuthService(usersService, jwtService);
    const result = await service.register({
      name: 'Novo Usuário',
      email: 'novo@example.com',
      password: 'password123',
    });

    expect(result.accessToken).toBe('mock-jwt-token');
    expect(result.user).toEqual(createdUser);
    expect(usersService.create).toHaveBeenCalledWith({
      name: 'Novo Usuário',
      email: 'novo@example.com',
      password: 'password123',
    });
  });
});
