export const REDIS_DEFAULTS = {
  host: 'localhost',
  port: 6379,
  db: 0,
  maxRetriesPerRequest: 3,
  maxRetryDelayMs: 2000,
  retryDelayMultiplierMs: 50,
} as const;

export const REDIS_ENV_KEYS = {
  host: 'REDIS_HOST',
  port: 'REDIS_PORT',
  password: 'REDIS_PASSWORD',
  db: 'REDIS_DB',
} as const;

export const REDIS_CLIENT_LABELS = {
  client: 'client',
  subscriber: 'subscriber',
} as const;
