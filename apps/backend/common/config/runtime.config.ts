export const DEFAULT_PORT = 3000;
export const DEFAULT_CORS_ORIGINS = ['http://localhost:5173'];
export const API_DOCS_PATH = '/api';

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

/**
 * API docs are public by nature, so they are off in production unless
 * explicitly enabled with ENABLE_API_DOCS=true.
 */
export function isApiDocsEnabled(env = process.env): boolean {
  if (env.ENABLE_API_DOCS !== undefined) {
    return env.ENABLE_API_DOCS === 'true';
  }
  return env.NODE_ENV !== 'production';
}

/**
 * Express "trust proxy" setting. Defaults to 1 hop in production (Render and
 * most PaaS sit behind one load balancer) and off elsewhere, so clients cannot
 * spoof X-Forwarded-For to dodge rate limits. Override with TRUST_PROXY.
 */
export function getTrustProxySetting(env = process.env): number | boolean {
  if (env.TRUST_PROXY !== undefined) {
    const hops = Number(env.TRUST_PROXY);
    return Number.isInteger(hops) ? hops : env.TRUST_PROXY === 'true';
  }
  return env.NODE_ENV === 'production' ? 1 : false;
}
