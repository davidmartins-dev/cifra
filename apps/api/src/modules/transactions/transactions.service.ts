import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { FilterTransactionDto } from './dto/filter-transaction.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTransactionDto) {
    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, userId },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    if (category.type !== dto.type) {
      throw new BadRequestException('O tipo da transação deve ser compatível com o tipo da categoria');
    }

    if (dto.accountId) {
      const account = await this.prisma.account.findFirst({
        where: { id: dto.accountId, userId },
      });

      if (!account) {
        throw new NotFoundException('Conta financeira não encontrada');
      }
    }

    return this.prisma.transaction.create({
      data: {
        description: dto.description.trim(),
        amount: dto.amount,
        type: dto.type,
        date: new Date(dto.date),
        notes: dto.notes ? dto.notes.trim() : null,
        userId,
        categoryId: dto.categoryId,
        accountId: dto.accountId ?? null,
      },
      include: {
        category: true,
        account: true,
      },
    });
  }

  async findAll(userId: string, filter?: FilterTransactionDto) {
    const take = filter?.limit;
    const skip = filter?.page && filter?.limit ? (filter.page - 1) * filter.limit : undefined;

    const where: Prisma.TransactionWhereInput = {
      userId,
      ...(filter?.type && { type: filter.type }),
      ...(filter?.categoryId && { categoryId: filter.categoryId }),
      ...(filter?.accountId && { accountId: filter.accountId }),
      ...((filter?.startDate || filter?.endDate) && {
        date: {
          ...(filter?.startDate && { gte: new Date(filter.startDate) }),
          ...(filter?.endDate && { lte: new Date(filter.endDate) }),
        },
      }),
    };

    return this.prisma.transaction.findMany({
      where,
      include: {
        category: true,
        account: true,
      },
      orderBy: { date: 'desc' },
      ...(take !== undefined && { take }),
      ...(skip !== undefined && { skip }),
    });
  }

  async findById(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
      include: {
        category: true,
        account: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada');
    }

    return transaction;
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    const current = await this.findById(userId, id);

    const targetCategoryId = dto.categoryId ?? current.categoryId;
    const targetType = dto.type ?? current.type;

    if (dto.categoryId !== undefined || dto.type !== undefined) {
      const category = await this.prisma.category.findFirst({
        where: { id: targetCategoryId, userId },
      });

      if (!category) {
        throw new NotFoundException('Categoria não encontrada');
      }

      if (category.type !== targetType) {
        throw new BadRequestException('O tipo da transação deve ser compatível com o tipo da categoria');
      }
    }

    if (dto.accountId !== undefined && dto.accountId !== null) {
      const account = await this.prisma.account.findFirst({
        where: { id: dto.accountId, userId },
      });

      if (!account) {
        throw new NotFoundException('Conta financeira não encontrada');
      }
    }

    return this.prisma.transaction.update({
      where: { id },
      data: {
        ...(dto.description !== undefined && { description: dto.description.trim() }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
        ...(dto.notes !== undefined && { notes: dto.notes ? dto.notes.trim() : null }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.accountId !== undefined && { accountId: dto.accountId }),
      },
      include: {
        category: true,
        account: true,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findById(userId, id);

    await this.prisma.transaction.delete({
      where: { id },
    });

    return { message: 'Transação removida com sucesso' };
  }
}
