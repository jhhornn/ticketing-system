import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { v4 as uuidv4 } from 'uuid';

export interface RedlockOptions {
  ttlMs?: number;
  retries?: number;
  retryDelayMs?: number;
  clockDriftMs?: number;
}

export interface RedlockResult {
  acquired: boolean;
  validityMs?: number;
  resource?: string;
  value?: string;
}

/**
 * Redlock implementation for distributed locking across multiple Redis instances
 * Based on the Redlock algorithm: https://redis.io/topics/distlock
 *
 * This provides stronger consistency guarantees than single-instance Redis locks
 * by requiring a majority of Redis instances to agree on the lock.
 */
@Injectable()
export class RedlockService {
  private readonly logger = new Logger(RedlockService.name);
  private readonly DEFAULT_TTL_MS = 30000;
  private readonly DEFAULT_RETRIES = 3;
  private readonly DEFAULT_RETRY_DELAY_MS = 200;
  private readonly DEFAULT_CLOCK_DRIFT_MS = 100;

  private readonly RELEASE_LOCK_SCRIPT = `
    if redis.call('get', KEYS[1]) == ARGV[1] then
      return redis.call('del', KEYS[1])
    else
      return 0
    end
  `;

  // In production, you would have multiple Redis instances
  // For now, we'll use a single instance but the algorithm supports multiple
  private redisInstances: RedisService[];

  constructor(private readonly redisService: RedisService) {
    // In production, inject multiple RedisService instances
    this.redisInstances = [redisService];
  }

  /**
   * Try to acquire a lock using the Redlock algorithm
   * @param resource - The resource to lock
   * @param options - Redlock options
   * @returns RedlockResult indicating success and validity time
   */
  async tryLock(
    resource: string,
    options: RedlockOptions = {},
  ): Promise<RedlockResult> {
    const ttlMs = options.ttlMs || this.DEFAULT_TTL_MS;
    const clockDriftMs = options.clockDriftMs || this.DEFAULT_CLOCK_DRIFT_MS;

    const lockKey = `redlock:${resource}`;
    const lockValue = uuidv4();
    const startTime = Date.now();

    let acquiredCount = 0;
    const quorum = Math.floor(this.redisInstances.length / 2) + 1;

    // Step 1: Try to acquire lock on all Redis instances
    const acquirePromises = this.redisInstances.map(async (redis) => {
      try {
        const client = redis.getClient();
        const result = await client.set(
          lockKey,
          lockValue,
          'PX',
          ttlMs,
          'NX',
        );
        return result === 'OK';
      } catch (error) {
        this.logger.warn(
          `Failed to acquire lock on Redis instance: ${error.message}`,
        );
        return false;
      }
    });

    const results = await Promise.all(acquirePromises);
    acquiredCount = results.filter((r) => r).length;

    // Step 2: Calculate elapsed time and validity
    const elapsed = Date.now() - startTime;
    const validityMs = ttlMs - elapsed - clockDriftMs;

    // Step 3: Check if we acquired a quorum
    const acquired = acquiredCount >= quorum && validityMs > 0;

    if (!acquired) {
      // Failed to acquire quorum, release any locks we did acquire
      await this.releaseLock(lockKey, lockValue);
      return { acquired: false };
    }

    this.logger.debug(
      `Redlock acquired: ${lockKey} (${acquiredCount}/${this.redisInstances.length} instances, validity: ${validityMs}ms)`,
    );

    return {
      acquired: true,
      validityMs,
      resource: lockKey,
      value: lockValue,
    };
  }

  /**
   * Try to acquire a lock with retries
   * @param resource - The resource to lock
   * @param options - Redlock options
   * @returns RedlockResult indicating success
   */
  async acquireLock(
    resource: string,
    options: RedlockOptions = {},
  ): Promise<RedlockResult> {
    const retries = options.retries || this.DEFAULT_RETRIES;
    const retryDelayMs = options.retryDelayMs || this.DEFAULT_RETRY_DELAY_MS;

    for (let attempt = 0; attempt <= retries; attempt++) {
      const result = await this.tryLock(resource, options);

      if (result.acquired) {
        return result;
      }

      // Add random jitter to prevent thundering herd
      const jitter = Math.random() * retryDelayMs;
      if (attempt < retries) {
        await this.sleep(retryDelayMs + jitter);
      }
    }

    return { acquired: false };
  }

  /**
   * Release a lock on all Redis instances
   * @param resource - The lock key
   * @param value - The lock value
   */
  async releaseLock(resource: string, value: string): Promise<void> {
    const releasePromises = this.redisInstances.map(async (redis) => {
      try {
        await redis.eval(this.RELEASE_LOCK_SCRIPT, [resource], [value]);
      } catch (error) {
        this.logger.warn(
          `Failed to release lock on Redis instance: ${error.message}`,
        );
      }
    });

    await Promise.allSettled(releasePromises);
    this.logger.debug(`Redlock released: ${resource}`);
  }

  /**
   * Execute a function while holding a Redlock
   * @param resource - The resource to lock
   * @param fn - The function to execute
   * @param options - Redlock options
   * @returns The result of the function
   */
  async withLock<T>(
    resource: string,
    fn: () => Promise<T>,
    options: RedlockOptions = {},
  ): Promise<T> {
    const lockResult = await this.acquireLock(resource, options);

    if (!lockResult.acquired) {
      throw new Error(`Failed to acquire Redlock for resource: ${resource}`);
    }

    try {
      return await fn();
    } finally {
      await this.releaseLock(lockResult.resource!, lockResult.value!);
    }
  }

  /**
   * Get quorum size for the current number of Redis instances
   */
  getQuorum(): number {
    return Math.floor(this.redisInstances.length / 2) + 1;
  }

  /**
   * Sleep for a specified number of milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
