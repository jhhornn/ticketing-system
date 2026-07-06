export const LOCK_DEFAULTS = {
  ttlSeconds: 30,
  retries: 0,
  retryDelayMs: 100,
} as const;

export const REDLOCK_DEFAULTS = {
  ttlMs: 30000,
  retries: 3,
  retryDelayMs: 200,
  clockDriftMs: 100,
} as const;

export const LOCK_PREFIX = 'lock:';
export const REDLOCK_PREFIX = 'redlock:';

export const RELEASE_LOCK_SCRIPT = `
  if redis.call('get', KEYS[1]) == ARGV[1] then
    return redis.call('del', KEYS[1])
  else
    return 0
  end
`;
