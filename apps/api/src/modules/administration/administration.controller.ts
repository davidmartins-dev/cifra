import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AdministrationService } from './administration.service.js';
import { FilterAdminUsersDto } from './dto/filter-admin-users.dto.js';
import { UpdateUserRoleDto } from './dto/update-user-role.dto.js';

@ApiTags('administration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('administration')
export class AdministrationController {
  constructor(
    private readonly administrationService: AdministrationService,
  ) {}

  @Get('metrics')
  @ApiOperation({
    summary: 'Retorna métricas operacionais e globais da plataforma (Apenas Administradores)',
  })
  @ApiResponse({ status: 200, description: 'Métricas da plataforma obtidas com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado: permissões insuficientes' })
  getPlatformMetrics() {
    return this.administrationService.getPlatformMetrics();
  }

  @Get('users')
  @ApiOperation({
    summary: 'Lista usuários da plataforma com paginação, contadores e filtros (Apenas Administradores)',
  })
  @ApiResponse({ status: 200, description: 'Lista de usuários obtida com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado: permissões insuficientes' })
  listUsers(@Query() filter: FilterAdminUsersDto) {
    return this.administrationService.listUsers(filter);
  }

  @Get('users/:id')
  @ApiOperation({
    summary: 'Busca detalhes e recursos vinculados de um usuário específico (Apenas Administradores)',
  })
  @ApiResponse({ status: 200, description: 'Detalhes do usuário obtidos com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado: permissões insuficientes' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  getUserDetails(@Param('id') id: string) {
    return this.administrationService.getUserDetails(id);
  }

  @Patch('users/:id/role')
  @ApiOperation({
    summary: 'Atualiza o papel (role) de um usuário (Apenas Administradores)',
  })
  @ApiResponse({ status: 200, description: 'Papel do usuário atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Tentativa de revogar o próprio privilégio' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado: permissões insuficientes' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  updateUserRole(
    @CurrentUser('id') adminUserId: string,
    @Param('id') targetUserId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.administrationService.updateUserRole(
      adminUserId,
      targetUserId,
      dto,
    );
  }
}
