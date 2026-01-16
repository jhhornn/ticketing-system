import { Injectable, Logger } from '@nestjs/common';
import { EmailStrategy } from './email-strategy.interface.js';

@Injectable()
export class SmtpEmailStrategy implements EmailStrategy {
  private readonly logger = new Logger(SmtpEmailStrategy.name);

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    // Implementation for SMTP (e.g., using nodemailer) would go here
    this.logger.warn(`[SMTP] Sending email to ${to} with subject "${subject}" (Not Implemented)`);
  }
}
