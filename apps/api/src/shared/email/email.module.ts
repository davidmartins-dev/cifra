import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DisposableEmailService } from './disposable-email.service.js';
import { EmailService } from './email.service.js';

@Module({
  imports: [ConfigModule],
  providers: [EmailService, DisposableEmailService],
  exports: [EmailService, DisposableEmailService],
})
export class EmailModule {}
