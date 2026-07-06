export const DEFAULT_PORT = 3000;
export const DEFAULT_CORS_ORIGINS = ['http://localhost:5173'];

export const THROTTLER_DEFAULTS = {
  ttl: 60000,
  limit: 100,
} as const;

export function getAllowedOrigins(
  corsOriginsEnv = process.env.CORS_ORIGINS,
): string[] {
  if (!corsOriginsEnv) {
    return DEFAULT_CORS_ORIGINS;
  }

  const origins = corsOriginsEnv
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : DEFAULT_CORS_ORIGINS;
}
