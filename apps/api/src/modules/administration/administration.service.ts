import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service.js';
import { FilterAdminUsersDto } from './dto/filter-admin-users.dto.js';
import { UpdateUserRoleDto } from './dto/update-user-role.dto.js';

@Injectable()
export class AdministrationService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlatformMetrics() {
    const [totalUsers, totalAccounts, txAgg] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.account.count(),
      this.prisma.transaction.aggregate({
        _count: { id: true },
        _sum: { amount: true },
      }),
    ]);

    const totalTransactions = txAgg._count.id;
    const totalTransactionVolume = Number(
      Number(txAgg._sum.amount ?? 0).toFixed(2),
    );

    return {
      totalUsers,
      totalAccounts,
      totalTransactions,
      totalTransactionVolume,
    };
  }

  async listUsers(filter?: FilterAdminUsersDto) {
    const page = filter?.page ?? 1;
    const limit = filter?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...(filter?.role && { role: filter.role }),
      ...(filter?.search && {
        OR: [
          { name: { contains: filter.search, mode: 'insensitive' } },
          { email: { contains: filter.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              accounts: true,
              transactions: true,
              categories: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getUserDetails(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            accounts: true,
            transactions: true,
            categories: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async updateUserRole(
    adminUserId: string,
    targetUserId: string,
    dto: UpdateUserRoleDto,
  ) {
    if (adminUserId === targetUserId && dto.role !== UserRole.ADMIN) {
      throw new BadRequestException(
        'Não é permitido revogar o próprio privilégio de administrador',
      );
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: dto.role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });
  }
}
