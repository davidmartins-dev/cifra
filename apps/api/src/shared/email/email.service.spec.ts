import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import nodemailer from 'nodemailer';
import { EmailService } from './email.service.js';

describe('EmailService', () => {
  const mockSendMail = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: mockSendMail,
    } as unknown as ReturnType<typeof nodemailer.createTransport>);
  });

  it('deve registrar no log e não disparar e-mail se as credenciais SMTP não estiverem configuradas', async () => {
    const configService = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'SMTP_HOST') return undefined;
        if (key === 'SMTP_USER') return undefined;
        if (key === 'SMTP_PASS') return undefined;
        return undefined;
      }),
    } as unknown as ConfigService;

    const service = new EmailService(configService);

    await service.sendVerificationCode({
      to: 'user@example.com',
      code: '123456',
    });

    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('deve disparar e-mail com sucesso quando o SMTP estiver configurado', async () => {
    const configService = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'SMTP_HOST') return 'smtp.gmail.com';
        if (key === 'SMTP_PORT') return 465;
        if (key === 'SMTP_SECURE') return true;
        if (key === 'SMTP_USER') return 'cifra@gmail.com';
        if (key === 'SMTP_PASS') return 'app_password';
        if (key === 'EMAIL_FROM') return 'Cifra <cifra@gmail.com>';
        return undefined;
      }),
    } as unknown as ConfigService;

    mockSendMail.mockResolvedValueOnce({ messageId: '123' });

    const service = new EmailService(configService);

    await service.sendVerificationCode({
      to: 'user@example.com',
      code: '654321',
      actionText: 'confirmar seu cadastro',
      expiresInMinutes: 5,
    });

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const callArgs = mockSendMail.mock.calls[0][0];
    expect(callArgs.to).toBe('user@example.com');
    expect(callArgs.subject).toContain('654321');
    expect(callArgs.html).toContain('654321');
  });

  it('deve propagar a exceção se o transporte do Nodemailer falhar', async () => {
    const configService = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'SMTP_HOST') return 'smtp.gmail.com';
        if (key === 'SMTP_USER') return 'cifra@gmail.com';
        if (key === 'SMTP_PASS') return 'app_password';
        return undefined;
      }),
    } as unknown as ConfigService;

    mockSendMail.mockRejectedValueOnce(new Error('Falha de conexão SMTP'));

    const service = new EmailService(configService);

    await expect(
      service.sendVerificationCode({
        to: 'user@example.com',
        code: '999999',
      }),
    ).rejects.toThrow('Falha de conexão SMTP');
  });
});
