import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { AdministrationController } from './administration.controller.js';
import { AdministrationService } from './administration.service.js';

@Module({
  controllers: [AdministrationController],
  providers: [AdministrationService, RolesGuard],
  exports: [AdministrationService],
})
export class AdministrationModule {}
