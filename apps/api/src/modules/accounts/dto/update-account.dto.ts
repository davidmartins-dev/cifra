import { ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateAccountDto {
  @ApiPropertyOptional({ example: 'Nubank Reserva', description: 'Nome da conta financeira' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'O nome da conta deve ser um texto' })
  @IsNotEmpty({ message: 'O nome da conta não pode ser vazio' })
  name?: string;

  @ApiPropertyOptional({
    enum: AccountType,
    example: AccountType.SAVINGS,
    description: 'Tipo da conta financeira',
  })
  @IsOptional()
  @IsEnum(AccountType, {
    message: 'Tipo de conta inválido. Opções válidas: CHECKING, SAVINGS, INVESTMENT, CASH, OTHER',
  })
  type?: AccountType;

  @ApiPropertyOptional({
    example: 250.75,
    description: 'Saldo da conta financeira',
  })
  @IsOptional()
  @IsNumber({}, { message: 'O saldo deve ser um número válido' })
  balance?: number;
}
