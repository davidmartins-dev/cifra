import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { RolesGuard } from './roles.guard.js';

describe('RolesGuard', () => {
  const mockReflector = {
    getAllAndOverride: vi.fn(),
  } as unknown as Reflector;

  const createMockContext = (user?: { role?: UserRole }) => {
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  it('deve permitir acesso se nenhuma role for exigida', () => {
    vi.mocked(mockReflector.getAllAndOverride).mockReturnValue(undefined);

    const guard = new RolesGuard(mockReflector);
    const context = createMockContext({ role: UserRole.USER });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('deve permitir acesso se o usuário tiver a role exigida (ADMIN)', () => {
    vi.mocked(mockReflector.getAllAndOverride).mockReturnValue([UserRole.ADMIN]);

    const guard = new RolesGuard(mockReflector);
    const context = createMockContext({ role: UserRole.ADMIN });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('deve lançar ForbiddenException se o usuário não possuir a role exigida (USER tentando acessar rota ADMIN)', () => {
    vi.mocked(mockReflector.getAllAndOverride).mockReturnValue([UserRole.ADMIN]);

    const guard = new RolesGuard(mockReflector);
    const context = createMockContext({ role: UserRole.USER });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('deve lançar ForbiddenException se não houver usuário ou papel na requisição', () => {
    vi.mocked(mockReflector.getAllAndOverride).mockReturnValue([UserRole.ADMIN]);

    const guard = new RolesGuard(mockReflector);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
