import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountType, Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service.js';
import { CreateAccountDto } from './dto/create-account.dto.js';
import { UpdateAccountDto } from './dto/update-account.dto.js';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateAccountDto) {
    const name = dto.name.trim();

    const existing = await this.prisma.account.findUnique({
      where: {
        userId_name: {
          userId,
          name,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Já existe uma conta com este nome');
    }

    try {
      return await this.prisma.account.create({
        data: {
          name,
          type: dto.type ?? AccountType.CHECKING,
          balance: dto.balance ?? 0,
          userId,
        },
      });
    } catch (error: unknown) {
      if (
        (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') ||
        (typeof error === 'object' && error !== null && 'code' in error && (error as { code: unknown }).code === 'P2002')
      ) {
        throw new ConflictException('Já existe uma conta com este nome');
      }
      throw error;
    }
  }

  async findAll(userId: string) {
    return this.prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(userId: string, id: string) {
    const account = await this.prisma.account.findFirst({
      where: { id, userId },
    });

    if (!account) {
      throw new NotFoundException('Conta não encontrada');
    }

    return account;
  }

  async update(userId: string, id: string, dto: UpdateAccountDto) {
    await this.findById(userId, id);

    const name = dto.name !== undefined ? dto.name.trim() : undefined;

    if (name) {
      const existing = await this.prisma.account.findUnique({
        where: {
          userId_name: {
            userId,
            name,
          },
        },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Já existe uma conta com este nome');
      }
    }

    try {
      return await this.prisma.account.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(dto.type !== undefined && { type: dto.type }),
          ...(dto.balance !== undefined && { balance: dto.balance }),
        },
      });
    } catch (error: unknown) {
      if (
        (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') ||
        (typeof error === 'object' && error !== null && 'code' in error && (error as { code: unknown }).code === 'P2002')
      ) {
        throw new ConflictException('Já existe uma conta com este nome');
      }
      throw error;
    }
  }

  async remove(userId: string, id: string) {
    await this.findById(userId, id);

    await this.prisma.account.delete({
      where: { id },
    });

    return { message: 'Conta removida com sucesso' };
  }
}
