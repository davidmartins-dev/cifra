import { EmailVerificationPurpose } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailVerificationController } from './email-verification.controller.js';
import type { EmailVerificationService } from './email-verification.service.js';

describe('EmailVerificationController', () => {
  let controller: EmailVerificationController;
  let serviceMock: {
    sendVerificationCode: ReturnType<typeof vi.fn>;
    verifyCode: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    serviceMock = {
      sendVerificationCode: vi.fn(),
      verifyCode: vi.fn(),
    };

    controller = new EmailVerificationController(
      serviceMock as unknown as EmailVerificationService,
    );
  });

  describe('send', () => {
    it('deve delegar o envio do código para o serviço e retornar o resultado', async () => {
      const responsePayload = {
        message: 'Código de verificação enviado com sucesso',
        expiresInMinutes: 15,
      };
      serviceMock.sendVerificationCode.mockResolvedValue(responsePayload);

      const dto = {
        email: 'david@example.com',
        purpose: EmailVerificationPurpose.SIGNUP,
      };

      const result = await controller.send(dto);

      expect(serviceMock.sendVerificationCode).toHaveBeenCalledWith(dto);
      expect(result).toEqual(responsePayload);
    });
  });

  describe('verify', () => {
    it('deve delegar a verificação do código para o serviço e retornar o resultado', async () => {
      const responsePayload = {
        verified: true,
        message: 'Código verificado com sucesso',
      };
      serviceMock.verifyCode.mockResolvedValue(responsePayload);

      const dto = {
        email: 'david@example.com',
        code: '123456',
        purpose: EmailVerificationPurpose.SIGNUP,
      };

      const result = await controller.verify(dto);

      expect(serviceMock.verifyCode).toHaveBeenCalledWith(dto);
      expect(result).toEqual(responsePayload);
    });
  });
});
