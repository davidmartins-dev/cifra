import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: UserRole,
    example: UserRole.ADMIN,
    description: 'Novo papel do usuário (ADMIN ou USER)',
  })
  @IsNotEmpty({ message: 'O papel do usuário é obrigatório' })
  @IsEnum(UserRole, {
    message: 'Papel inválido. Opções válidas: ADMIN, USER',
  })
  role: UserRole;
}
