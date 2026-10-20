import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CategorySummaryQueryDto } from './dto/category-summary-query.dto.js';
import { FinancialSummaryQueryDto } from './dto/financial-summary-query.dto.js';
import { MonthlyEvolutionQueryDto } from './dto/monthly-evolution-query.dto.js';
import { FinancialSummaryService } from './financial-summary.service.js';

@ApiTags('financial-summary')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('financial-summary')
export class FinancialSummaryController {
  constructor(
    private readonly financialSummaryService: FinancialSummaryService,
  ) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Retorna o resumo financeiro geral (saldo atual, receitas, despesas e saldo líquido)',
  })
  @ApiResponse({ status: 200, description: 'Resumo geral obtido com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Conta financeira não encontrada' })
  getOverview(
    @CurrentUser('id') userId: string,
    @Query() query: FinancialSummaryQueryDto,
  ) {
    return this.financialSummaryService.getOverview(userId, query);
  }

  @Get('by-category')
  @ApiOperation({
    summary: 'Retorna a distribuição de despesas ou receitas agrupadas por categoria com valores e percentuais',
  })
  @ApiResponse({ status: 200, description: 'Resumo por categoria obtido com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Conta financeira não encontrada' })
  getByCategory(
    @CurrentUser('id') userId: string,
    @Query() query: CategorySummaryQueryDto,
  ) {
    return this.financialSummaryService.getByCategory(userId, query);
  }

  @Get('monthly-evolution')
  @ApiOperation({
    summary: 'Retorna a evolução financeira mês a mês ao longo de um ano',
  })
  @ApiResponse({ status: 200, description: 'Evolução mensal obtida com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  getMonthlyEvolution(
    @CurrentUser('id') userId: string,
    @Query() query: MonthlyEvolutionQueryDto,
  ) {
    return this.financialSummaryService.getMonthlyEvolution(userId, query);
  }
}
