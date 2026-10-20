import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AuditService } from './audit.service.js';
import { FilterAuditLogsDto } from './dto/filter-audit-logs.dto.js';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista registros de auditoria com paginação e filtros (Apenas Administradores)',
  })
  @ApiResponse({ status: 200, description: 'Registros de auditoria obtidos com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado: permissões insuficientes' })
  findAll(@Query() filter: FilterAuditLogsDto) {
    return this.auditService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Busca detalhes de um registro de auditoria específico (Apenas Administradores)',
  })
  @ApiResponse({ status: 200, description: 'Registro de auditoria obtido com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado: permissões insuficientes' })
  @ApiResponse({ status: 404, description: 'Registro de auditoria não encontrado' })
  findById(@Param('id') id: string) {
    return this.auditService.findById(id);
  }
}
