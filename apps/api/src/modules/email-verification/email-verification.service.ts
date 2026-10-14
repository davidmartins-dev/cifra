import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailVerificationPurpose } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomInt } from 'node:crypto';
import { PrismaService } from '../../shared/database/prisma.service.js';
import { DisposableEmailService } from '../../shared/email/disposable-email.service.js';
import { EmailService } from '../../shared/email/email.service.js';
import { SendVerificationCodeDto } from './dto/send-verification-code.dto.js';
import { VerifyCodeDto } from './dto/verify-code.dto.js';

@Injectable()
export class EmailVerificationService {
  private readonly defaultExpirationMinutes: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly disposableEmailService: DisposableEmailService,
    private readonly configService: ConfigService,
  ) {
    const configuredMinutes = this.configService.get<number | string>(
      'EMAIL_VERIFICATION_EXPIRES_IN_MINUTES',
    );
    this.defaultExpirationMinutes = configuredMinutes
      ? Number(configuredMinutes)
      : 5;
  }

  async sendVerificationCode(
    dto: SendVerificationCodeDto,
  ): Promise<{ message: string; expiresInMinutes: number }> {
    await this.disposableEmailService.validate(dto.email);

    const code = randomInt(100000, 1000000).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(
      Date.now() + this.defaultExpirationMinutes * 60 * 1000,
    );

    await this.prisma.emailVerification.deleteMany({
      where: {
        email: dto.email,
        purpose: dto.purpose,
        consumedAt: null,
      },
    });

    await this.prisma.emailVerification.create({
      data: {
        email: dto.email,
        codeHash,
        purpose: dto.purpose,
        expiresAt,
      },
    });

    const actionText =
      dto.purpose === EmailVerificationPurpose.SIGNUP
        ? 'completar seu cadastro no Cifra'
        : 'redefinir sua senha no Cifra';

    await this.emailService.sendVerificationCode({
      to: dto.email,
      code,
      actionText,
      expiresInMinutes: this.defaultExpirationMinutes,
    });

    return {
      message: 'Código de verificação enviado com sucesso',
      expiresInMinutes: this.defaultExpirationMinutes,
    };
  }

  async verifyCode(
    dto: VerifyCodeDto,
  ): Promise<{
    verified: boolean;
    message: string;
    verificationTicket: string;
  }> {
    const verification = await this.prisma.emailVerification.findFirst({
      where: {
        email: dto.email,
        purpose: dto.purpose,
        consumedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!verification) {
      throw new BadRequestException(
        'Nenhum código de verificação pendente encontrado para este e-mail',
      );
    }

    if (verification.expiresAt < new Date()) {
      throw new BadRequestException('O código de verificação expirou');
    }

    if (verification.attempts >= verification.maxAttempts) {
      throw new BadRequestException(
        'Número máximo de tentativas excedido. Solicite um novo código',
      );
    }

    const isValid = await bcrypt.compare(dto.code, verification.codeHash);

    if (!isValid) {
      await this.prisma.emailVerification.update({
        where: { id: verification.id },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      const remainingAttempts =
        verification.maxAttempts - (verification.attempts + 1);
      if (remainingAttempts <= 0) {
        throw new BadRequestException(
          'Código inválido. Limite de tentativas atingido, solicite um novo código',
        );
      }

      throw new BadRequestException(
        `Código inválido. Você tem mais ${remainingAttempts} tentativa(s)`,
      );
    }

    await this.prisma.emailVerification.update({
      where: { id: verification.id },
      data: {
        consumedAt: new Date(),
      },
    });

    return {
      verified: true,
      message: 'Código verificado com sucesso',
      verificationTicket: verification.id,
    };
  }

  async validateVerificationTicket(
    ticket: string,
    email: string,
    purpose: EmailVerificationPurpose,
  ): Promise<void> {
    if (!ticket) {
      throw new BadRequestException('Ticket de verificação é obrigatório');
    }

    const verification = await this.prisma.emailVerification.findUnique({
      where: { id: ticket },
    });

    if (
      !verification ||
      verification.email.toLowerCase() !== email.trim().toLowerCase() ||
      verification.purpose !== purpose ||
      !verification.consumedAt
    ) {
      throw new BadRequestException(
        'Ticket de verificação inválido ou inexistente para este e-mail',
      );
    }

    const ticketMaxAgeMs = 30 * 60 * 1000;
    if (Date.now() - verification.consumedAt.getTime() > ticketMaxAgeMs) {
      throw new BadRequestException('Ticket de verificação expirado');
    }

    await this.prisma.emailVerification.delete({
      where: { id: ticket },
    });
  }
}

