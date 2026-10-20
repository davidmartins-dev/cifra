import { describe, expect, it, vi } from 'vitest';
import { AuditController } from './audit.controller.js';
import type { AuditService, PaginatedAuditLogsResponse, AuditLogWithUser } from './audit.service.js';
import type { FilterAuditLogsDto } from './dto/filter-audit-logs.dto.js';

describe('AuditController', () => {
  const mockAuditLog: AuditLogWithUser = {
    id: 'log-uuid-1',
    userId: 'user-uuid-1',
    action: 'AUTH_LOGIN',
    resource: 'User',
    resourceId: 'user-uuid-1',
    details: { method: 'password' },
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    createdAt: new Date('2026-10-20T10:00:00.000Z'),
    user: {
      id: 'user-uuid-1',
      name: 'David',
      email: 'david@cifra.app',
      role: 'ADMIN',
    },
  };

  it('deve delegar a listagem de registros de auditoria para o AuditService', async () => {
    const mockResponse: PaginatedAuditLogsResponse = {
      data: [mockAuditLog],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    };

    const service = {
      findAll: vi.fn().mockResolvedValue(mockResponse),
    } as unknown as AuditService;

    const controller = new AuditController(service);
    const filter: FilterAuditLogsDto = {
      action: 'AUTH_LOGIN',
      page: 1,
      limit: 20,
    };

    const result = await controller.findAll(filter);

    expect(service.findAll).toHaveBeenCalledWith(filter);
    expect(result).toEqual(mockResponse);
  });

  it('deve delegar a busca de registro por ID para o AuditService', async () => {
    const service = {
      findById: vi.fn().mockResolvedValue(mockAuditLog),
    } as unknown as AuditService;

    const controller = new AuditController(service);
    const result = await controller.findById('log-uuid-1');

    expect(service.findById).toHaveBeenCalledWith('log-uuid-1');
    expect(result).toEqual(mockAuditLog);
  });
});
