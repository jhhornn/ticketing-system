import { ConfigService } from '@nestjs/config';
import type { FactoryProvider } from '@nestjs/common';
import {
  DEFAULT_EMAIL_PROVIDER,
  EMAIL_PROVIDER_ENV_KEY,
  EMAIL_STRATEGY_TOKEN,
} from './email.constants.js';
import { createEmailStrategy } from './email.strategy.factory.js';

export const emailStrategyProvider: FactoryProvider = {
  provide: EMAIL_STRATEGY_TOKEN,
  useFactory: (configService: ConfigService) => {
    const emailProvider = configService.get<string>(
      EMAIL_PROVIDER_ENV_KEY,
      DEFAULT_EMAIL_PROVIDER,
    );

    return createEmailStrategy(emailProvider);
  },
  inject: [ConfigService],
};
