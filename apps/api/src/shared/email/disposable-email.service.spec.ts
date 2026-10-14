import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolveMx } from 'node:dns/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DisposableEmailService } from './disposable-email.service.js';

vi.mock('node:dns/promises', () => ({
  resolveMx: vi.fn(),
}));

describe('DisposableEmailService', () => {
  let service: DisposableEmailService;
  let configServiceMock: {
    get: ReturnType<typeof vi.fn>;
  };
  const mockedResolveMx = vi.mocked(resolveMx);

  beforeEach(() => {
    vi.clearAllMocks();

    configServiceMock = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        return undefined;
      }),
    };

    service = new DisposableEmailService(
      configServiceMock as unknown as ConfigService,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve aprovar domínios consagrados (como gmail.com) instantaneamente sem consulta externa', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await expect(service.validate('usuario@gmail.com')).resolves.toBeUndefined();

    expect(mockedResolveMx).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('deve permitir example.com quando NODE_ENV for test', async () => {
    configServiceMock.get.mockReturnValue('test');

    await expect(service.validate('teste@example.com')).resolves.toBeUndefined();
    expect(mockedResolveMx).not.toHaveBeenCalled();
  });

  it('deve rejeitar e-mails com formato inválido', async () => {
    await expect(service.validate('email-sem-arroba')).rejects.toThrow(
      new BadRequestException('Formato de e-mail inválido'),
    );
  });

  it('deve rejeitar domínio que não possui registros MX válidos', async () => {
    mockedResolveMx.mockResolvedValue([]);

    await expect(service.validate('user@dominio-sem-mx.com')).rejects.toThrow(
      'O domínio de e-mail informado não possui servidores de recebimento válidos',
    );
  });

  it('deve rejeitar domínio quando a resolução DNS falha', async () => {
    mockedResolveMx.mockRejectedValue(new Error('ENOTFOUND'));

    await expect(service.validate('user@dominio-fantasma.com')).rejects.toThrow(
      'O domínio de e-mail informado não existe ou não está configurado para receber e-mails',
    );
  });

  it('deve rejeitar quando a API DeBounce indica que o e-mail é descartável', async () => {
    mockedResolveMx.mockResolvedValue([
      { exchange: 'mx.tempmail.com', priority: 10 },
    ]);

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ disposable: 'true' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(service.validate('user@tempmail.com')).rejects.toThrow(
      new BadRequestException('E-mails temporários ou descartáveis não são permitidos'),
    );
  });

  it('deve aprovar quando o domínio é legítimo e a API DeBounce confirma não ser descartável', async () => {
    mockedResolveMx.mockResolvedValue([
      { exchange: 'mail.minhaempresa.com.br', priority: 10 },
    ]);

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ disposable: 'false' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(service.validate('contato@minhaempresa.com.br')).resolves.toBeUndefined();
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Segunda chamada para o mesmo domínio deve utilizar o cache
    await expect(service.validate('outro@minhaempresa.com.br')).resolves.toBeUndefined();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('deve permitir por fallback se a API DeBounce retornar erro HTTP ou timeout', async () => {
    mockedResolveMx.mockResolvedValue([
      { exchange: 'mx.provedor.com', priority: 10 },
    ]);

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network timeout'));

    await expect(service.validate('user@provedor.com')).resolves.toBeUndefined();
  });
});
