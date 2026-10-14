import { BadRequestException } from '@nestjs/common';
import { EmailVerificationPurpose } from '@prisma/client';
import bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../shared/database/prisma.service.js';
import type { EmailService } from '../../shared/email/email.service.js';
import { EmailVerificationService } from './email-verification.service.js';

describe('EmailVerificationService', () => {
  let service: EmailVerificationService;
  let prismaMock: {
    emailVerification: {
      deleteMany: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };
  let emailServiceMock: {
    sendVerificationCode: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    prismaMock = {
      emailVerification: {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        create: vi.fn().mockResolvedValue({ id: 'verification-1' }),
        findFirst: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
      },
    };

    emailServiceMock = {
      sendVerificationCode: vi.fn().mockResolvedValue(undefined),
    };

    service = new EmailVerificationService(
      prismaMock as unknown as PrismaService,
      emailServiceMock as unknown as EmailService,
    );
  });

  describe('sendVerificationCode', () => {
    it('deve gerar código, salvar no banco e disparar e-mail com sucesso', async () => {
      const result = await service.sendVerificationCode({
        email: 'david@example.com',
        purpose: EmailVerificationPurpose.SIGNUP,
      });

      expect(prismaMock.emailVerification.deleteMany).toHaveBeenCalledWith({
        where: {
          email: 'david@example.com',
          purpose: EmailVerificationPurpose.SIGNUP,
          consumedAt: null,
        },
      });
      expect(prismaMock.emailVerification.create).toHaveBeenCalled();
      expect(emailServiceMock.sendVerificationCode).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'david@example.com',
          code: expect.stringMatching(/^\d{6}$/),
          expiresInMinutes: 15,
        }),
      );
      expect(result.message).toBe('Código de verificação enviado com sucesso');
      expect(result.expiresInMinutes).toBe(15);
    });
  });

  describe('verifyCode', () => {
    it('deve validar o código com sucesso e marcar como consumido', async () => {
      const hashedCode = await bcrypt.hash('123456', 10);
      prismaMock.emailVerification.findFirst.mockResolvedValue({
        id: 'verification-1',
        email: 'david@example.com',
        codeHash: hashedCode,
        purpose: EmailVerificationPurpose.SIGNUP,
        attempts: 0,
        maxAttempts: 3,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        consumedAt: null,
      });

      const result = await service.verifyCode({
        email: 'david@example.com',
        code: '123456',
        purpose: EmailVerificationPurpose.SIGNUP,
      });

      expect(result).toEqual({
        verified: true,
        message: 'Código verificado com sucesso',
      });
      expect(prismaMock.emailVerification.update).toHaveBeenCalledWith({
        where: { id: 'verification-1' },
        data: { consumedAt: expect.any(Date) },
      });
    });

    it('deve lançar BadRequestException se nenhum código pendente for encontrado', async () => {
      prismaMock.emailVerification.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyCode({
          email: 'david@example.com',
          code: '123456',
          purpose: EmailVerificationPurpose.SIGNUP,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se o código estiver expirado', async () => {
      prismaMock.emailVerification.findFirst.mockResolvedValue({
        id: 'verification-1',
        email: 'david@example.com',
        codeHash: 'hash',
        purpose: EmailVerificationPurpose.SIGNUP,
        attempts: 0,
        maxAttempts: 3,
        expiresAt: new Date(Date.now() - 1000),
        consumedAt: null,
      });

      await expect(
        service.verifyCode({
          email: 'david@example.com',
          code: '123456',
          purpose: EmailVerificationPurpose.SIGNUP,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException e incrementar tentativas se o código estiver incorreto', async () => {
      const hashedCode = await bcrypt.hash('654321', 10);
      prismaMock.emailVerification.findFirst.mockResolvedValue({
        id: 'verification-1',
        email: 'david@example.com',
        codeHash: hashedCode,
        purpose: EmailVerificationPurpose.SIGNUP,
        attempts: 0,
        maxAttempts: 3,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        consumedAt: null,
      });

      await expect(
        service.verifyCode({
          email: 'david@example.com',
          code: '123456',
          purpose: EmailVerificationPurpose.SIGNUP,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prismaMock.emailVerification.update).toHaveBeenCalledWith({
        where: { id: 'verification-1' },
        data: { attempts: { increment: 1 } },
      });
    });
  });
});
