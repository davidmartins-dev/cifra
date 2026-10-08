import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller.js';
import type { AuthService, PublicUser } from './auth.service.js';
import { AUTH_COOKIE_NAME } from './jwt.strategy.js';

describe('AuthController', () => {
  const mockUser: PublicUser = {
    id: 'user-1',
    name: 'David Martins',
    email: 'david@example.com',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createMockResponse = () => {
    return {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as Response;
  };

  const createController = (env = 'development') => {
    const authService = {
      login: vi.fn().mockResolvedValue({ accessToken: 'mock-jwt-token', user: mockUser }),
      register: vi.fn().mockResolvedValue({ accessToken: 'mock-jwt-token', user: mockUser }),
    } as unknown as AuthService;

    const configService = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return env;
        return undefined;
      }),
    } as unknown as ConfigService;

    const controller = new AuthController(authService, configService);
    return { controller, authService, configService };
  };

  it('deve realizar login, gravar cookie HttpOnly e retornar usuário', async () => {
    const { controller, authService } = createController('development');
    const res = createMockResponse();

    const response = await controller.login(
      { email: 'david@example.com', password: 'password123' },
      res,
    );

    expect(authService.login).toHaveBeenCalledWith({
      email: 'david@example.com',
      password: 'password123',
    });
    expect(res.cookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      'mock-jwt-token',
      expect.objectContaining({
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
        path: '/',
      }),
    );
    expect(response).toEqual({
      message: 'Login realizado com sucesso',
      user: mockUser,
    });
  });

  it('deve usar secure: true e sameSite: none em ambiente de produção no login', async () => {
    const { controller } = createController('production');
    const res = createMockResponse();

    await controller.login({ email: 'david@example.com', password: 'password123' }, res);

    expect(res.cookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      'mock-jwt-token',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      }),
    );
  });

  it('deve cadastrar usuário, gravar cookie e retornar mensagem de sucesso', async () => {
    const { controller, authService } = createController('development');
    const res = createMockResponse();

    const response = await controller.register(
      { name: 'David Martins', email: 'david@example.com', password: 'password123' },
      res,
    );

    expect(authService.register).toHaveBeenCalledWith({
      name: 'David Martins',
      email: 'david@example.com',
      password: 'password123',
    });
    expect(res.cookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      'mock-jwt-token',
      expect.objectContaining({
        httpOnly: true,
        maxAge: 15 * 60 * 1000,
      }),
    );
    expect(response).toEqual({
      message: 'Cadastro realizado com sucesso',
      user: mockUser,
    });
  });

  it('deve retornar os dados do usuário na rota me', () => {
    const { controller } = createController();
    const result = controller.me(mockUser);

    expect(result).toEqual({ user: mockUser });
  });

  it('deve limpar cookie de autenticação no logout', () => {
    const { controller } = createController('development');
    const res = createMockResponse();

    const result = controller.logout(res);

    expect(res.clearCookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      expect.objectContaining({
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      }),
    );
    expect(result).toEqual({ message: 'Sessão encerrada com sucesso' });
  });
});
