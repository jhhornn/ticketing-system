import { ConsoleEmailStrategy } from './strategies/console.strategy.js';
import { SendGridEmailStrategy } from './strategies/sendgrid.strategy.js';
import { SmtpEmailStrategy } from './strategies/smtp.strategy.js';
import {
  DEFAULT_EMAIL_PROVIDER,
  type EmailProvider,
} from './email.constants.js';
import type { EmailStrategy } from './strategies/email-strategy.interface.js';

const EMAIL_STRATEGY_FACTORIES: Record<EmailProvider, () => EmailStrategy> = {
  sendgrid: () => new SendGridEmailStrategy(),
  smtp: () => new SmtpEmailStrategy(),
  console: () => new ConsoleEmailStrategy(),
};

export function createEmailStrategy(provider?: string): EmailStrategy {
  const normalizedProvider = (provider || DEFAULT_EMAIL_PROVIDER).toLowerCase();
  return (
    EMAIL_STRATEGY_FACTORIES[normalizedProvider as EmailProvider]?.() ||
    EMAIL_STRATEGY_FACTORIES.console()
  );
}
