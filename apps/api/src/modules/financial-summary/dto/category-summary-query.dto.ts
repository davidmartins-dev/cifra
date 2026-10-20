import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { FinancialSummaryQueryDto } from './financial-summary-query.dto.js';

export class CategorySummaryQueryDto extends FinancialSummaryQueryDto {
  @ApiPropertyOptional({
    enum: TransactionType,
    example: TransactionType.EXPENSE,
    default: TransactionType.EXPENSE,
    description: 'Tipo de transação para agrupamento por categoria (INCOME ou EXPENSE)',
  })
  @IsOptional()
  @IsEnum(TransactionType, {
    message: 'Tipo de transação inválido. Opções válidas: INCOME, EXPENSE',
  })
  type?: TransactionType;
}
