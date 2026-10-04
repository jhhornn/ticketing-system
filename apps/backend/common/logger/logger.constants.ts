export const LOGGER_DEFAULTS = {
  service: 'ticketing-api',
  developmentLogLevel: 'debug',
  productionLogLevel: 'info',
} as const;

export const LOGGER_ENV_KEYS = {
  nodeEnv: 'NODE_ENV',
  logLevel: 'LOG_LEVEL',
} as const;
