import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({ example: 'Supermercado', description: 'Descrição da transação' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'A descrição da transação deve ser um texto' })
  @IsNotEmpty({ message: 'A descrição da transação é obrigatória' })
  description: string;

  @ApiProperty({ example: 125.5, description: 'Valor monetário da transação' })
  @IsNumber({}, { message: 'O valor da transação deve ser um número válido' })
  @IsPositive({ message: 'O valor da transação deve ser maior que zero' })
  amount: number;

  @ApiProperty({
    enum: TransactionType,
    example: TransactionType.EXPENSE,
    description: 'Tipo da transação (INCOME ou EXPENSE)',
  })
  @IsEnum(TransactionType, {
    message: 'Tipo de transação inválido. Opções válidas: INCOME, EXPENSE',
  })
  type: TransactionType;

  @ApiProperty({ example: '2026-10-20T10:00:00.000Z', description: 'Data da transação (formato ISO 8601)' })
  @IsISO8601({}, { message: 'A data deve ser uma string ISO 8601 válida' })
  @IsNotEmpty({ message: 'A data da transação é obrigatória' })
  date: string;

  @ApiPropertyOptional({ example: 'Compras do mês', description: 'Observações adicionais' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'As observações devem ser um texto' })
  notes?: string;

  @ApiProperty({ example: 'uuid-categoria', description: 'ID da categoria vinculada' })
  @IsString({ message: 'O ID da categoria deve ser um texto' })
  @IsNotEmpty({ message: 'A categoria é obrigatória' })
  categoryId: string;

  @ApiPropertyOptional({ example: 'uuid-conta', description: 'ID da conta financeira vinculada' })
  @IsOptional()
  @IsString({ message: 'O ID da conta deve ser um texto' })
  accountId?: string;
}
