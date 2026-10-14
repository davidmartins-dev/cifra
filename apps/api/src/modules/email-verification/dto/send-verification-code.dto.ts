import { ApiProperty } from '@nestjs/swagger';
import { EmailVerificationPurpose } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';

export class SendVerificationCodeDto {
  @ApiProperty({
    example: 'david@example.com', 
    description: 'E-mail para envio do código de verificação',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  email: string;

  @ApiProperty({
    enum: EmailVerificationPurpose,
    example: EmailVerificationPurpose.SIGNUP,
    description: 'Finalidade da verificação (SIGNUP ou PASSWORD_RESET)',
  })
  @IsEnum(EmailVerificationPurpose, { message: 'Finalidade de verificação inválida' })
  @IsNotEmpty({ message: 'A finalidade é obrigatória' })
  purpose: EmailVerificationPurpose;
}
