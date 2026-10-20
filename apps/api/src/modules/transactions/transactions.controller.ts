import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { FilterTransactionDto } from './dto/filter-transaction.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';
import { TransactionsService } from './transactions.service.js';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova transação financeira para o usuário logado' })
  @ApiResponse({ status: 201, description: 'Transação criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou incompatibilidade de categoria/tipo' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Categoria ou conta financeira não encontrada' })
  create(
    @CurrentUser('id') userId: string,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(userId, createTransactionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as transações financeiras do usuário logado com filtros e paginação' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Data inicial (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Data final (ISO 8601)' })
  @ApiQuery({ name: 'type', enum: TransactionType, required: false, description: 'Tipo da transação (INCOME ou EXPENSE)' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filtrar por ID da categoria' })
  @ApiQuery({ name: 'accountId', required: false, description: 'Filtrar por ID da conta' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Quantidade por página' })
  @ApiResponse({ status: 200, description: 'Lista de transações obtida com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findAll(
    @CurrentUser('id') userId: string,
    @Query() filter: FilterTransactionDto,
  ) {
    return this.transactionsService.findAll(userId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca os detalhes de uma transação financeira por id' })
  @ApiResponse({ status: 200, description: 'Transação financeira obtida com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Transação não encontrada' })
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.transactionsService.findById(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza dados de uma transação financeira' })
  @ApiResponse({ status: 200, description: 'Transação atualizada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou incompatibilidade de categoria/tipo' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Transação, categoria ou conta não encontrada' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(userId, id, updateTransactionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove uma transação financeira do usuário logado' })
  @ApiResponse({ status: 200, description: 'Transação removida com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Transação não encontrada' })
  remove(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.transactionsService.remove(userId, id);
  }
}
