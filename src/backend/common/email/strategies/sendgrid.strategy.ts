import { Injectable, Logger } from '@nestjs/common';
import { EmailStrategy } from './email-strategy.interface.js';
// import * as sgMail from '@sendgrid/mail'; // Uncomment when installing @sendgrid/mail

@Injectable()
export class SendGridEmailStrategy implements EmailStrategy {
  private readonly logger = new Logger(SendGridEmailStrategy.name);

  constructor() {
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    // const msg = {
    //   to,
    //   from: process.env.SENDGRID_FROM_EMAIL,
    //   subject,
    //   text: body,
    //   html: body,
    // };
    // await sgMail.send(msg);
    this.logger.log(`[SendGrid] Sending email to ${to} with subject "${subject}" (Simulated - Install @sendgrid/mail to enable)`);
  }
}
