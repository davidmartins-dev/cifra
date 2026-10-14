import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolveMx } from 'node:dns/promises';

@Injectable()
export class DisposableEmailService {
  private readonly logger = new Logger(DisposableEmailService.name);

  // Cache em memória de domínios já verificados para evitar requisições repetidas
  private readonly domainCache = new Map<
    string,
    { isDisposable: boolean; timestamp: number }
  >();
  private readonly cacheTtlMs = 24 * 60 * 60 * 1000; // 24 horas de cache

  // Provedores legítimos consagrados (permite bypass imediato com 0ms de latência e sem requisição)
  private readonly trustedDomains = new Set([
    'gmail.com',
    'googlemail.com',
    'hotmail.com',
    'outlook.com',
    'live.com',
    'msn.com',
    'yahoo.com',
    'yahoo.com.br',
    'icloud.com',
    'me.com',
    'mac.com',
    'proton.me',
    'protonmail.com',
    'bol.com.br',
    'uol.com.br',
    'terra.com.br',
    'globo.com',
  ]);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Valida a integridade do domínio de e-mail e se pertence a um provedor descartável/temporário.
   * Lança BadRequestException caso o e-mail seja descartável ou seu domínio não receba mensagens.
   */
  async validate(email: string): Promise<void> {
    const domain = this.extractDomain(email);
    if (!domain) {
      throw new BadRequestException('Formato de e-mail inválido');
    }

    const isTest = this.configService.get<string>('NODE_ENV') === 'test';
    if (isTest && (domain === 'example.com' || domain.endsWith('.example.com'))) {
      return;
    }

    // 1. Provedores confiáveis conhecidos
    if (this.trustedDomains.has(domain)) {
      return;
    }

    // 2. Consulta de cache local
    const cached = this.domainCache.get(domain);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      if (cached.isDisposable) {
        throw new BadRequestException(
          'E-mails temporários ou descartáveis não são permitidos',
        );
      }
      return;
    }

    // 3. Validação de MX via DNS
    await this.verifyMxRecords(domain);

    // 4. Verificação de provedor descartável via DeBounce
    const isDisposable = await this.checkWithDebounce(email, domain);
    this.domainCache.set(domain, { isDisposable, timestamp: Date.now() });

    if (isDisposable) {
      throw new BadRequestException(
        'E-mails temporários ou descartáveis não são permitidos',
      );
    }
  }

  private extractDomain(email: string): string | null {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return null;
    }
    const parts = email.trim().toLowerCase().split('@');
    return parts.length === 2 && parts[1] ? parts[1] : null;
  }

  private async verifyMxRecords(domain: string): Promise<void> {
    try {
      const records = await resolveMx(domain);
      const hasValidExchange =
        records && records.some((r) => r.exchange && r.exchange.trim().length > 0);

      if (!hasValidExchange) {
        throw new BadRequestException(
          'O domínio de e-mail informado não possui servidores de recebimento válidos',
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.debug(`Falha ao resolver registros MX para ${domain}: ${error}`);
      throw new BadRequestException(
        'O domínio de e-mail informado não existe ou não está configurado para receber e-mails',
      );
    }
  }

  private async checkWithDebounce(email: string, domain: string): Promise<boolean> {
    try {
      const url = `https://disposable.debounce.io/?email=${encodeURIComponent(email)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        this.logger.warn(
          `DeBounce API retornou status ${response.status} para ${domain}. Prosseguindo por fallback.`,
        );
        return false;
      }

      const data = (await response.json()) as { disposable?: string | boolean };
      return data.disposable === 'true' || data.disposable === true;
    } catch (error) {
      this.logger.warn(
        `Falha na consulta à API de e-mails descartáveis para ${domain}: ${error}. Prosseguindo por fallback.`,
      );
      return false;
    }
  }
}
