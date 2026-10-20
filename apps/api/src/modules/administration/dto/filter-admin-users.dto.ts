import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class FilterAdminUsersDto {
  @ApiPropertyOptional({
    example: 'david',
    description: 'Buscar usuários por nome ou e-mail',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'O termo de busca deve ser um texto' })
  search?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    example: UserRole.USER,
    description: 'Filtrar usuários por papel (ADMIN ou USER)',
  })
  @IsOptional()
  @IsEnum(UserRole, {
    message: 'Papel inválido. Opções válidas: ADMIN, USER',
  })
  role?: UserRole;

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
