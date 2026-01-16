import { Injectable, Logger } from '@nestjs/common';
import { EmailStrategy } from './email-strategy.interface.js';

@Injectable()
export class ConsoleEmailStrategy implements EmailStrategy {
  private readonly logger = new Logger(ConsoleEmailStrategy.name);

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    this.logger.log(`
      --- EMAIL SIMULATION ---
      To: ${to}
      Subject: ${subject}
      Body: ${body}
      ------------------------
    `);
  }
}
