import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({ example: 'Nubank', description: 'Nome da conta financeira' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'O nome da conta deve ser um texto' })
  @IsNotEmpty({ message: 'O nome da conta é obrigatório' })
  name: string;

  @ApiPropertyOptional({
    enum: AccountType,
    example: AccountType.CHECKING,
    description: 'Tipo da conta financeira',
    default: AccountType.CHECKING,
  })
  @IsOptional()
  @IsEnum(AccountType, {
    message: 'Tipo de conta inválido. Opções válidas: CHECKING, SAVINGS, INVESTMENT, CASH, OTHER',
  })
  type?: AccountType;

  @ApiPropertyOptional({
    example: 100.5,
    description: 'Saldo inicial da conta',
    default: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'O saldo deve ser um número válido' })
  balance?: number;
}
