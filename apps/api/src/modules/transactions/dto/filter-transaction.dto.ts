import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator';

export class FilterTransactionDto {
  @ApiPropertyOptional({ example: '2026-10-01T00:00:00.000Z', description: 'Data inicial para filtro (ISO 8601)' })
  @IsOptional()
  @IsISO8601({}, { message: 'startDate deve ser uma data ISO 8601 válida' })
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-10-31T23:59:59.999Z', description: 'Data final para filtro (ISO 8601)' })
  @IsOptional()
  @IsISO8601({}, { message: 'endDate deve ser uma data ISO 8601 válida' })
  endDate?: string;

  @ApiPropertyOptional({
    enum: TransactionType,
    example: TransactionType.EXPENSE,
    description: 'Tipo da transação (INCOME ou EXPENSE)',
  })
  @IsOptional()
  @IsEnum(TransactionType, {
    message: 'Tipo de transação inválido. Opções válidas: INCOME, EXPENSE',
  })
  type?: TransactionType;

  @ApiPropertyOptional({ example: 'uuid-categoria', description: 'Filtrar por ID da categoria' })
  @IsOptional()
  @IsString({ message: 'categoryId deve ser um texto' })
  categoryId?: string;

  @ApiPropertyOptional({ example: 'uuid-conta', description: 'Filtrar por ID da conta' })
  @IsOptional()
  @IsString({ message: 'accountId deve ser um texto' })
  accountId?: string;

  @ApiPropertyOptional({ example: 1, description: 'Número da página', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'A página deve ser um número inteiro' })
  @Min(1, { message: 'A página deve ser maior ou igual a 1' })
  page?: number;

  @ApiPropertyOptional({ example: 20, description: 'Quantidade de registros por página', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O limite deve ser um número inteiro' })
  @Min(1, { message: 'O limite mínimo por página é 1' })
  @Max(100, { message: 'O limite máximo por página é 100' })
  limit?: number;
}
