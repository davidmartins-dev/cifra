import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class FinancialSummaryQueryDto {
  @ApiPropertyOptional({
    example: '2026-10-01T00:00:00.000Z',
    description: 'Data inicial para o resumo financeiro (ISO 8601)',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'startDate deve ser uma data ISO 8601 válida' })
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-10-31T23:59:59.999Z',
    description: 'Data final para o resumo financeiro (ISO 8601)',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'endDate deve ser uma data ISO 8601 válida' })
  endDate?: string;

  @ApiPropertyOptional({
    example: 'uuid-conta',
    description: 'Filtrar resumo por conta financeira específica',
  })
  @IsOptional()
  @IsString({ message: 'accountId deve ser um texto' })
  accountId?: string;
}
