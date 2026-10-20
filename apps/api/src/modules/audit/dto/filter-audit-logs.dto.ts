import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsISO8601, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class FilterAuditLogsDto {
  @ApiPropertyOptional({
    example: 'user-uuid-1',
    description: 'Filtrar por ID do usuário que executou ou sofreu a ação',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'O userId deve ser um texto' })
  userId?: string;

  @ApiPropertyOptional({
    example: 'AUTH_LOGIN',
    description: 'Filtrar por ação executada (ex: AUTH_LOGIN, USER_ROLE_UPDATED)',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'A action deve ser um texto' })
  action?: string;

  @ApiPropertyOptional({
    example: 'User',
    description: 'Filtrar por recurso afetado (ex: User, Account, Transaction)',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'O resource deve ser um texto' })
  resource?: string;

  @ApiPropertyOptional({
    example: '2026-10-01T00:00:00.000Z',
    description: 'Data inicial para o filtro (ISO 8601)',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'startDate deve ser uma data ISO 8601 válida' })
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-10-31T23:59:59.999Z',
    description: 'Data final para o filtro (ISO 8601)',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'endDate deve ser uma data ISO 8601 válida' })
  endDate?: string;

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
