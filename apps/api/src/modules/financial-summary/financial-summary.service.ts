import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service.js';
import { CategorySummaryQueryDto } from './dto/category-summary-query.dto.js';
import { FinancialSummaryQueryDto } from './dto/financial-summary-query.dto.js';
import { MonthlyEvolutionQueryDto } from './dto/monthly-evolution-query.dto.js';

@Injectable()
export class FinancialSummaryService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(userId: string, query?: FinancialSummaryQueryDto) {
    if (query?.accountId) {
      await this.validateAccountOwnership(userId, query.accountId);
    }

    const accountsWhere: Prisma.AccountWhereInput = {
      userId,
      ...(query?.accountId && { id: query.accountId }),
    };

    const accounts = await this.prisma.account.findMany({
      where: accountsWhere,
      select: { balance: true },
    });

    const currentBalance = Number(
      accounts.reduce((acc, curr) => acc + Number(curr.balance), 0).toFixed(2),
    );

    const whereTx: Prisma.TransactionWhereInput = {
      userId,
      ...(query?.accountId && { accountId: query.accountId }),
      ...((query?.startDate || query?.endDate) && {
        date: {
          ...(query?.startDate && { gte: new Date(query.startDate) }),
          ...(query?.endDate && { lte: new Date(query.endDate) }),
        },
      }),
    };

    const [incomeAgg, expenseAgg] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { ...whereTx, type: TransactionType.INCOME },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.transaction.aggregate({
        where: { ...whereTx, type: TransactionType.EXPENSE },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const totalIncome = Number(Number(incomeAgg._sum.amount ?? 0).toFixed(2));
    const totalExpense = Number(Number(expenseAgg._sum.amount ?? 0).toFixed(2));
    const netBalance = Number((totalIncome - totalExpense).toFixed(2));

    return {
      currentBalance,
      totalIncome,
      totalExpense,
      netBalance,
      incomeCount: incomeAgg._count.id,
      expenseCount: expenseAgg._count.id,
    };
  }

  async getByCategory(userId: string, query?: CategorySummaryQueryDto) {
    if (query?.accountId) {
      await this.validateAccountOwnership(userId, query.accountId);
    }

    const type = query?.type ?? TransactionType.EXPENSE;

    const whereTx: Prisma.TransactionWhereInput = {
      userId,
      type,
      ...(query?.accountId && { accountId: query.accountId }),
      ...((query?.startDate || query?.endDate) && {
        date: {
          ...(query?.startDate && { gte: new Date(query.startDate) }),
          ...(query?.endDate && { lte: new Date(query.endDate) }),
        },
      }),
    };

    const grouped = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: whereTx,
      _sum: { amount: true },
      _count: { id: true },
    });

    const categoryIds = grouped.map((g) => g.categoryId);

    const categories =
      categoryIds.length > 0
        ? await this.prisma.category.findMany({
            where: {
              id: { in: categoryIds },
              userId,
            },
            select: { id: true, name: true },
          })
        : [];

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    const totalAmount = Number(
      grouped
        .reduce((acc, curr) => acc + Number(curr._sum.amount ?? 0), 0)
        .toFixed(2),
    );

    const items = grouped
      .map((g) => {
        const amount = Number(Number(g._sum.amount ?? 0).toFixed(2));
        const percentage =
          totalAmount > 0
            ? Number(((amount / totalAmount) * 100).toFixed(2))
            : 0;

        return {
          categoryId: g.categoryId,
          categoryName: categoryMap.get(g.categoryId) ?? 'Categoria desconhecida',
          amount,
          percentage,
          count: g._count.id,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return {
      type,
      totalAmount,
      categories: items,
    };
  }

  async getMonthlyEvolution(userId: string, query?: MonthlyEvolutionQueryDto) {
    const year = query?.year ?? new Date().getFullYear();
    const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
        type: true,
        date: true,
      },
    });

    const monthNames = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];

    const months = monthNames.map((monthName, index) => ({
      month: index + 1,
      monthName,
      income: 0,
      expense: 0,
      net: 0,
    }));

    for (const tx of transactions) {
      const monthIdx = new Date(tx.date).getUTCMonth();
      const amount = Number(tx.amount);
      if (tx.type === TransactionType.INCOME) {
        months[monthIdx].income += amount;
      } else {
        months[monthIdx].expense += amount;
      }
    }

    for (const m of months) {
      m.income = Number(m.income.toFixed(2));
      m.expense = Number(m.expense.toFixed(2));
      m.net = Number((m.income - m.expense).toFixed(2));
    }

    const totalIncome = Number(
      months.reduce((acc, m) => acc + m.income, 0).toFixed(2),
    );
    const totalExpense = Number(
      months.reduce((acc, m) => acc + m.expense, 0).toFixed(2),
    );
    const netTotal = Number((totalIncome - totalExpense).toFixed(2));

    return {
      year,
      totalIncome,
      totalExpense,
      netTotal,
      months,
    };
  }

  private async validateAccountOwnership(userId: string, accountId: string) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException('Conta financeira não encontrada');
    }

    return account;
  }
}
