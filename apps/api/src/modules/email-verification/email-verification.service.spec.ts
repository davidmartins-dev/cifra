import { BadRequestException } from '@nestjs/common';
import { EmailVerificationPurpose } from '@prisma/client';
import bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../../shared/database/prisma.service.js';
import type { DisposableEmailService } from '../../shared/email/disposable-email.service.js';
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
    user: {
      findUnique: ReturnType<typeof vi.fn>;
    };
  };
  let emailServiceMock: {
    sendVerificationCode: ReturnType<typeof vi.fn>;
  };
  let disposableEmailServiceMock: {
    validate: ReturnType<typeof vi.fn>;
  };
  let configServiceMock: {
    get: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    prismaMock = {
      emailVerification: {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        create: vi.fn().mockResolvedValue({ id: 'verification-1' }),
        findFirst: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
      },
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };

    emailServiceMock = {
      sendVerificationCode: vi.fn().mockResolvedValue(undefined),
    };

    disposableEmailServiceMock = {
      validate: vi.fn().mockResolvedValue(undefined),
    };

    configServiceMock = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'EMAIL_VERIFICATION_EXPIRES_IN_MINUTES') return 5;
        return undefined;
      }),
    };

    service = new EmailVerificationService(
      prismaMock as unknown as PrismaService,
      emailServiceMock as unknown as EmailService,
      disposableEmailServiceMock as unknown as DisposableEmailService,
      configServiceMock as unknown as ConfigService,
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
          expiresInMinutes: 5,
        }),
      );
      expect(result.message).toBe('Código de verificação enviado com sucesso');
      expect(result.expiresInMinutes).toBe(5);
    });

    it('deve lançar BadRequestException e não criar código se o e-mail for descartável', async () => {
      disposableEmailServiceMock.validate.mockRejectedValueOnce(
        new BadRequestException('E-mails temporários ou descartáveis não são permitidos'),
      );

      await expect(
        service.sendVerificationCode({
          email: 'user@tempmail.com',
          purpose: EmailVerificationPurpose.SIGNUP,
        }),
      ).rejects.toThrow('E-mails temporários ou descartáveis não são permitidos');

      expect(prismaMock.emailVerification.create).not.toHaveBeenCalled();
      expect(emailServiceMock.sendVerificationCode).not.toHaveBeenCalled();
    });

    it('deve usar 5 minutos como fallback se a variável EMAIL_VERIFICATION_EXPIRES_IN_MINUTES não estiver configurada', async () => {
      configServiceMock.get.mockReturnValue(undefined);
      const customService = new EmailVerificationService(
        prismaMock as unknown as PrismaService,
        emailServiceMock as unknown as EmailService,
        disposableEmailServiceMock as unknown as DisposableEmailService,
        configServiceMock as unknown as ConfigService,
      );

      const result = await customService.sendVerificationCode({
        email: 'david@example.com',
        purpose: EmailVerificationPurpose.SIGNUP,
      });

      expect(result.expiresInMinutes).toBe(5);
    });

    it('deve lançar NotFoundException se o e-mail não existir para PASSWORD_RESET', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.sendVerificationCode({
          email: 'naoexiste@example.com',
          purpose: EmailVerificationPurpose.PASSWORD_RESET,
        }),
      ).rejects.toThrow('Nenhuma conta encontrada com este e-mail');

      expect(prismaMock.emailVerification.create).not.toHaveBeenCalled();
      expect(emailServiceMock.sendVerificationCode).not.toHaveBeenCalled();
    });

    it('deve lançar ConflictException se o e-mail já estiver cadastrado para SIGNUP', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'user-1', email: 'existe@example.com' });

      await expect(
        service.sendVerificationCode({
          email: 'existe@example.com',
          purpose: EmailVerificationPurpose.SIGNUP,
        }),
      ).rejects.toThrow('Este e-mail já está cadastrado na plataforma');

      expect(prismaMock.emailVerification.create).not.toHaveBeenCalled();
      expect(emailServiceMock.sendVerificationCode).not.toHaveBeenCalled();
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
        verificationTicket: 'verification-1',
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
