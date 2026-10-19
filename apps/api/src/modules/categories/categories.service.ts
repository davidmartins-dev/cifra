import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCategoryDto) {
    const name = dto.name.trim();
    const type = dto.type;

    const existing = await this.prisma.category.findUnique({
      where: {
        userId_name_type: {
          userId,
          name,
          type,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Já existe uma categoria com este nome e tipo');
    }

    try {
      return await this.prisma.category.create({
        data: {
          name,
          type,
          userId,
        },
      });
    } catch (error: unknown) {
      if (
        (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') ||
        (typeof error === 'object' && error !== null && 'code' in error && (error as { code: unknown }).code === 'P2002')
      ) {
        throw new ConflictException('Já existe uma categoria com este nome e tipo');
      }
      throw error;
    }
  }

  async findAll(userId: string, type?: TransactionType) {
    return this.prisma.category.findMany({
      where: {
        userId,
        ...(type !== undefined ? { type } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    return category;
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const current = await this.findById(userId, id);

    const name = dto.name !== undefined ? dto.name.trim() : undefined;
    const type = dto.type !== undefined ? dto.type : undefined;

    const targetName = name ?? current.name;
    const targetType = type ?? current.type;

    if (name !== undefined || type !== undefined) {
      const existing = await this.prisma.category.findUnique({
        where: {
          userId_name_type: {
            userId,
            name: targetName,
            type: targetType,
          },
        },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Já existe uma categoria com este nome e tipo');
      }
    }

    try {
      return await this.prisma.category.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(type !== undefined && { type }),
        },
      });
    } catch (error: unknown) {
      if (
        (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') ||
        (typeof error === 'object' && error !== null && 'code' in error && (error as { code: unknown }).code === 'P2002')
      ) {
        throw new ConflictException('Já existe uma categoria com este nome e tipo');
      }
      throw error;
    }
  }

  async remove(userId: string, id: string) {
    await this.findById(userId, id);

    try {
      await this.prisma.category.delete({
        where: { id },
      });

      return { message: 'Categoria removida com sucesso' };
    } catch (error: unknown) {
      if (
        (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') ||
        (typeof error === 'object' && error !== null && 'code' in error && (error as { code: unknown }).code === 'P2003')
      ) {
        throw new ConflictException('Não é possível excluir uma categoria vinculada a transações');
      }
      throw error;
    }
  }
}
