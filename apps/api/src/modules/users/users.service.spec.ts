import { ConflictException, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../shared/database/prisma.service.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  it('deve criar um usuário com senha hasheada com sucesso', async () => {
    const mockUser = {
      id: 'user-id-1',
      name: 'David Martins',
      email: 'david@example.com',
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(mockUser),
      },
    } as unknown as PrismaService;

    vi.spyOn(bcrypt, 'hash').mockImplementation(async () => 'hashed_password');

    const service = new UsersService(prisma);
    const result = await service.create({
      name: 'David Martins',
      email: 'david@example.com',
      password: 'password123',
    });

    expect(result).toEqual(mockUser);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'david@example.com' },
    });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: 'David Martins',
        email: 'david@example.com',
        passwordHash: 'hashed_password',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

  it('deve lançar ConflictException se o e-mail já estiver em uso', async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 'existing-id', email: 'david@example.com' }),
      },
    } as unknown as PrismaService;

    const service = new UsersService(prisma);

    await expect(
      service.create({
        name: 'David Martins',
        email: 'david@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('deve retornar o usuário por id', async () => {
    const mockUser = {
      id: 'user-id-1',
      name: 'David Martins',
      email: 'david@example.com',
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(mockUser),
      },
    } as unknown as PrismaService;

    const service = new UsersService(prisma);
    const result = await service.findById('user-id-1');

    expect(result).toEqual(mockUser);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-id-1' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

  it('deve lançar NotFoundException se o usuário não for encontrado por id', async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaService;

    const service = new UsersService(prisma);

    await expect(service.findById('non-existent-id')).rejects.toThrow(NotFoundException);
  });

  it('deve buscar usuário por e-mail', async () => {
    const mockUserWithPassword = {
      id: 'user-id-1',
      name: 'David Martins',
      email: 'david@example.com',
      passwordHash: 'hashed_password',
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(mockUserWithPassword),
      },
    } as unknown as PrismaService;

    const service = new UsersService(prisma);
    const result = await service.findByEmail('david@example.com');

    expect(result).toEqual(mockUserWithPassword);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'david@example.com' },
    });
  });
});
