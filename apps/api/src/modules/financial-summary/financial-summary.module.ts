import { Module } from '@nestjs/common';
import { FinancialSummaryController } from './financial-summary.controller.js';
import { FinancialSummaryService } from './financial-summary.service.js';

@Module({
  controllers: [FinancialSummaryController],
  providers: [FinancialSummaryService],
  exports: [FinancialSummaryService],
})
export class FinancialSummaryModule {}
