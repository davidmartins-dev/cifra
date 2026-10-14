import { ApiProperty } from '@nestjs/swagger';
import { EmailVerificationPurpose } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyCodeDto {
  @ApiProperty({
    example: 'david@example.com',
    description: 'E-mail associado ao código de verificação',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Código numérico de 6 dígitos enviado por e-mail',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'O código deve ser um texto' })
  @Length(6, 6, { message: 'O código de verificação deve ter exatamente 6 dígitos' })
  @IsNotEmpty({ message: 'O código é obrigatório' })
  code: string;

  @ApiProperty({
    enum: EmailVerificationPurpose,
    example: EmailVerificationPurpose.SIGNUP,
    description: 'Finalidade da verificação (SIGNUP ou PASSWORD_RESET)',
  })
  @IsEnum(EmailVerificationPurpose, { message: 'Finalidade de verificação inválida' })
  @IsNotEmpty({ message: 'A finalidade é obrigatória' })
  purpose: EmailVerificationPurpose;
}
