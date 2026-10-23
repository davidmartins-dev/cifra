import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'David Martins', description: 'Nome do usuário' })
  @IsString({ message: 'O nome deve ser um texto' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  name: string;

  @ApiProperty({ example: 'david@example.com', description: 'E-mail do usuário' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  email: string;

  @ApiProperty({ example: 'SenhaForte123', minLength: 8, description: 'Senha de acesso' })
  @IsString({ message: 'A senha deve ser um texto' })
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
  @Matches(/[A-Z]/, { message: 'A senha deve conter ao menos uma letra maiúscula' })
  @Matches(/[a-z]/, { message: 'A senha deve conter ao menos uma letra minúscula' })
  @Matches(/[0-9]/, { message: 'A senha deve conter ao menos um número' })
  @Matches(/[^A-Za-z0-9]/, { message: 'A senha deve conter ao menos um caractere especial' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  password: string;
}
