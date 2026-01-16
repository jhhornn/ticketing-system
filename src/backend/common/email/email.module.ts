import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from './email.service.js';
import { ConsoleEmailStrategy } from './strategies/console.strategy.js';
import { SendGridEmailStrategy } from './strategies/sendgrid.strategy.js';
import { SmtpEmailStrategy } from './strategies/smtp.strategy.js';

const emailStrategyFactory = {
  provide: 'EMAIL_STRATEGY',
  useFactory: (configService: ConfigService) => {
    const emailProvider = configService.get<string>('EMAIL_PROVIDER', 'console');

    switch (emailProvider) {
      case 'sendgrid':
        return new SendGridEmailStrategy();
      case 'smtp':
        return new SmtpEmailStrategy();
      case 'console':
      default:
        return new ConsoleEmailStrategy();
    }
  },
  inject: [ConfigService],
};

@Module({
  imports: [ConfigModule],
  providers: [EmailService, emailStrategyFactory],
  exports: [EmailService],
})
export class EmailModule {}
