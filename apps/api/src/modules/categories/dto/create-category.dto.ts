import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Alimentação', description: 'Nome da categoria' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'O nome da categoria deve ser um texto' })
  @IsNotEmpty({ message: 'O nome da categoria é obrigatório' })
  name: string;

  @ApiProperty({
    enum: TransactionType,
    example: TransactionType.EXPENSE,
    description: 'Tipo da categoria (receita ou despesa)',
  })
  @IsEnum(TransactionType, {
    message: 'Tipo de categoria inválido. Opções válidas: INCOME, EXPENSE',
  })
  type: TransactionType;
}
