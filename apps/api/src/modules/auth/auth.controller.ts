import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { CookieOptions, Response } from 'express';
import { CreateUserDto } from '../users/dto/create-user.dto.js';
import { AuthService, type PublicUser } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { AUTH_COOKIE_NAME } from './jwt.strategy.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private getCookieOptions(): CookieOptions {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutos (padrão de segurança para finanças)
      path: '/',
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Realiza autenticação e grava cookie HttpOnly seguro' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados de requisição inválidos' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(loginDto);
    response.cookie(AUTH_COOKIE_NAME, result.accessToken, this.getCookieOptions());
    return { message: 'Login realizado com sucesso', user: result.user };
  }

  @Post('register')
  @ApiOperation({ summary: 'Cadastra usuário e grava cookie HttpOnly seguro' })
  @ApiResponse({ status: 201, description: 'Usuário cadastrado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados de requisição inválidos' })
  @ApiResponse({ status: 409, description: 'E-mail já cadastrado' })
  async register(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(createUserDto);
    response.cookie(AUTH_COOKIE_NAME, result.accessToken, this.getCookieOptions());
    return { message: 'Cadastro realizado com sucesso', user: result.user };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna os dados do usuário autenticado na sessão atual' })
  @ApiResponse({ status: 200, description: 'Usuário autenticado obtido com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  me(@CurrentUser() user: PublicUser) {
    return { user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Encerra a sessão e remove o cookie HttpOnly' })
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso' })
  logout(@Res({ passthrough: true }) response: Response) {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    response.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    });
    return { message: 'Sessão encerrada com sucesso' };
  }
}
