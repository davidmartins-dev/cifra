import { Prisma } from '@prisma/client';

export type CreateAuditLogDto = {
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  details?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
};
