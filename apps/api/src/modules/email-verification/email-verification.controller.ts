import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SendVerificationCodeDto } from './dto/send-verification-code.dto.js';
import { VerifyCodeDto } from './dto/verify-code.dto.js';
import { EmailVerificationService } from './email-verification.service.js';

@ApiTags('email-verification')
@Controller('email-verification')
export class EmailVerificationController {
  constructor(
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Envia código de verificação para o e-mail' })
  @ApiResponse({ status: 200, description: 'Código enviado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados de requisição inválidos' })
  @ApiResponse({ status: 429, description: 'Muitas solicitações. Tente novamente em 1 minuto' })
  async send(@Body() dto: SendVerificationCodeDto) {
    return this.emailVerificationService.sendVerificationCode(dto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Valida o código de verificação recebido por e-mail' })
  @ApiResponse({ status: 200, description: 'Código verificado com sucesso' })
  @ApiResponse({ status: 400, description: 'Código inválido ou expirado' })
  async verify(@Body() dto: VerifyCodeDto) {
    return this.emailVerificationService.verifyCode(dto);
  }
}
