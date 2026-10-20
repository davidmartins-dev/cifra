import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class MonthlyEvolutionQueryDto {
  @ApiPropertyOptional({
    example: 2026,
    description: 'Ano para cálculo da evolução mensal',
    default: new Date().getFullYear(),
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O ano deve ser um número inteiro' })
  @Min(2000, { message: 'O ano mínimo permitido é 2000' })
  @Max(2100, { message: 'O ano máximo permitido é 2100' })
  year?: number;
}
