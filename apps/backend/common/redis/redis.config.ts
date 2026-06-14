import type { RedisOptions } from 'ioredis';
import { REDIS_DEFAULTS, REDIS_ENV_KEYS } from './redis.constants.js';

function parseNumberEnvVar(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = raw ? parseInt(raw, 10) : NaN;

  return Number.isNaN(parsed) ? fallback : parsed;
}

export function createRedisConfigFromEnv(): RedisOptions {
  return {
    host: process.env[REDIS_ENV_KEYS.host] || REDIS_DEFAULTS.host,
    port: parseNumberEnvVar(REDIS_ENV_KEYS.port, REDIS_DEFAULTS.port),
    password: process.env[REDIS_ENV_KEYS.password] || undefined,
    db: parseNumberEnvVar(REDIS_ENV_KEYS.db, REDIS_DEFAULTS.db),
    retryStrategy: (times: number) => {
      return Math.min(
        times * REDIS_DEFAULTS.retryDelayMultiplierMs,
        REDIS_DEFAULTS.maxRetryDelayMs,
      );
    },
    maxRetriesPerRequest: REDIS_DEFAULTS.maxRetriesPerRequest,
  };
}
