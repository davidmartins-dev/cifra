import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { CreateUserDto as BaseCreateUserDto } from '../../users/dto/create-user.dto.js';

export class CreateUserDto extends BaseCreateUserDto {
  @ApiProperty({
    example: 'd9b2d63d-a233-4f9e-bf33-28c9b3c48719',
    description: 'Ticket gerado na validação do código de verificação de e-mail',
  })
  @IsString({ message: 'O ticket de verificação deve ser um texto' })
  @IsNotEmpty({ message: 'O ticket de verificação é obrigatório' })
  verificationTicket: string;
}

export { CreateUserDto as RegisterDto };
