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
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova categoria para o usuário logado' })
  @ApiResponse({ status: 201, description: 'Categoria criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 409, description: 'Já existe uma categoria com este nome e tipo' })
  create(
    @CurrentUser('id') userId: string,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(userId, createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as categorias do usuário logado' })
  @ApiQuery({
    name: 'type',
    enum: TransactionType,
    required: false,
    description: 'Filtrar por tipo (INCOME ou EXPENSE)',
  })
  @ApiResponse({ status: 200, description: 'Lista de categorias obtida com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findAll(
    @CurrentUser('id') userId: string,
    @Query('type') type?: TransactionType,
  ) {
    return this.categoriesService.findAll(userId, type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca os detalhes de uma categoria por id' })
  @ApiResponse({ status: 200, description: 'Categoria obtida com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.categoriesService.findById(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza dados de uma categoria' })
  @ApiResponse({ status: 200, description: 'Categoria atualizada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  @ApiResponse({ status: 409, description: 'Já existe uma categoria com este nome e tipo' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(userId, id, updateCategoryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove uma categoria do usuário logado' })
  @ApiResponse({ status: 200, description: 'Categoria removida com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  @ApiResponse({ status: 409, description: 'Não é possível excluir uma categoria vinculada a transações' })
  remove(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.categoriesService.remove(userId, id);
  }
}
