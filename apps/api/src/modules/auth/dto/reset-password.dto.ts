import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'david@example.com', description: 'E-mail do usuário' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  email: string;

  @ApiProperty({ example: 'NovaSenhaForte123', minLength: 8, description: 'Nova senha de acesso' })
  @IsString({ message: 'A senha deve ser um texto' })
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
  @Matches(/[A-Z]/, { message: 'A senha deve conter ao menos uma letra maiúscula' })
  @Matches(/[a-z]/, { message: 'A senha deve conter ao menos uma letra minúscula' })
  @Matches(/[0-9]/, { message: 'A senha deve conter ao menos um número' })
  @Matches(/[^A-Za-z0-9]/, { message: 'A senha deve conter ao menos um caractere especial' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  password: string;

  @ApiProperty({
    example: 'd9b2d63d-a233-4f9e-bf33-28c9b3c48719',
    description: 'Ticket gerado na validação do código de verificação de e-mail (PASSWORD_RESET)',
  })
  @IsString({ message: 'O ticket de verificação deve ser um texto' })
  @IsNotEmpty({ message: 'O ticket de verificação é obrigatório' })
  verificationTicket: string;
}
