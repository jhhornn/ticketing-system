import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service.js';
import { emailStrategyProvider } from './email.providers.js';

@Module({
  imports: [ConfigModule],
  providers: [EmailService, emailStrategyProvider],
  exports: [EmailService],
})
export class EmailModule {}
