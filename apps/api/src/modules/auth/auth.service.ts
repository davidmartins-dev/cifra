import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmailVerificationPurpose, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { EmailVerificationService } from '../email-verification/email-verification.service.js';
import { UsersService } from '../users/users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
};

type AuthResponse = {
  accessToken: string;
  user: PublicUser;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  async register(dto: CreateUserDto): Promise<AuthResponse> {
    await this.emailVerificationService.validateVerificationTicket(
      dto.verificationTicket,
      dto.email,
      EmailVerificationPurpose.SIGNUP,
    );

    const user = await this.usersService.create(dto);

    return {
      accessToken: this.jwtService.sign(this.buildPayload(user)),
      user: this.buildPublicUser(user),
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return {
      accessToken: this.jwtService.sign(this.buildPayload(user)),
      user: this.buildPublicUser(user),
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    await this.emailVerificationService.validateVerificationTicket(
      dto.verificationTicket,
      dto.email,
      EmailVerificationPurpose.PASSWORD_RESET,
    );

    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new BadRequestException('Usuário não encontrado');
    }

    await this.usersService.updatePassword(user.id, dto.password);

    return {
      message: 'Senha redefinida com sucesso',
    };
  }

  private buildPayload(user: Pick<User, 'id' | 'email' | 'role'>): JwtPayload {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
  }

  private buildPublicUser(user: Pick<User, 'id' | 'name' | 'email' | 'role' | 'createdAt' | 'updatedAt'>): PublicUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
