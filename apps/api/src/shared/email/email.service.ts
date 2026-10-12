import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { render } from '@react-email/render';
import nodemailer, { type Transporter } from 'nodemailer';
import * as React from 'react';
import { VerificationCodeEmail } from './templates/verification-code.js';

export interface SendVerificationEmailOptions {
  to: string;
  code: string;
  actionText?: string;
  expiresInMinutes?: number;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const secureValue = this.configService.get<string | boolean>('SMTP_SECURE');
    const secure = secureValue === true || secureValue === 'true';
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    this.fromAddress =
      this.configService.get<string>('EMAIL_FROM') ||
      (user ? `"Cifra" <${user}>` : '"Cifra" <no-reply@cifra.com>');

    this.transporter = nodemailer.createTransport({
      host,
      port: port ? Number(port) : undefined,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async sendVerificationCode({
    to,
    code,
    actionText = 'confirmar sua identidade no Cifra',
    expiresInMinutes = 5,
  }: SendVerificationEmailOptions): Promise<void> {
    const html = await render(
      React.createElement(VerificationCodeEmail, {
        code,
        actionText,
        expiresInMinutes,
      }),
    );

    const hasSmtpConfigured = Boolean(
      this.configService.get<string>('SMTP_HOST') &&
        this.configService.get<string>('SMTP_USER') &&
        this.configService.get<string>('SMTP_PASS'),
    );

    if (!hasSmtpConfigured) {
      this.logger.warn(
        `SMTP não configurado. Código [${code}] para [${to}] apenas registrado no log.`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject: `${code} é o seu código de verificação - Cifra`,
        html,
      });

      this.logger.log(`E-mail de verificação enviado com sucesso para ${to}`);
    } catch (error) {
      this.logger.error(`Falha ao enviar e-mail de verificação para ${to}:`, error);
      throw error;
    }
  }
}
