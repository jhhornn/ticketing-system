import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { v4 as uuidv4 } from 'uuid';

export interface LockOptions {
  ttlSeconds?: number;
  retries?: number;
  retryDelayMs?: number;
}

export interface Lock {
  key: string;
  value: string;
  ttlSeconds: number;
}

@Injectable()
export class LockingService {
  private readonly logger = new Logger(LockingService.name);
  private readonly DEFAULT_TTL_SECONDS = 30;
  private readonly DEFAULT_RETRIES = 0;
  private readonly DEFAULT_RETRY_DELAY_MS = 100;

  // Lua script for atomic lock release
  // Only deletes the lock if the value matches (prevents deleting someone else's lock)
  private readonly RELEASE_LOCK_SCRIPT = `
    if redis.call('get', KEYS[1]) == ARGV[1] then
      return redis.call('del', KEYS[1])
    else
      return 0
    end
  `;

  constructor(private readonly redisService: RedisService) {}

  /**
   * Acquire a distributed lock
   * @param resource - The resource to lock (e.g., 'seat:123')
   * @param options - Lock options
   * @returns Lock object if acquired, null otherwise
   */
  async acquireLock(
    resource: string,
    options: LockOptions = {},
  ): Promise<Lock | null> {
    const ttlSeconds = options.ttlSeconds || this.DEFAULT_TTL_SECONDS;
    const retries = options.retries || this.DEFAULT_RETRIES;
    const retryDelayMs = options.retryDelayMs || this.DEFAULT_RETRY_DELAY_MS;

    const lockKey = this.getLockKey(resource);
    const lockValue = uuidv4();

    // Try to acquire lock with retries
    for (let attempt = 0; attempt <= retries; attempt++) {
      const acquired = await this.redisService.setnx(
        lockKey,
        lockValue,
        ttlSeconds,
      );

      if (acquired) {
        this.logger.debug(`Lock acquired: ${lockKey}`);
        return {
          key: lockKey,
          value: lockValue,
          ttlSeconds,
        };
      }

      // If not the last attempt, wait before retrying
      if (attempt < retries) {
        await this.sleep(retryDelayMs);
      }
    }

    this.logger.debug(`Failed to acquire lock: ${lockKey}`);
    return null;
  }

  /**
   * Release a distributed lock
   * Uses Lua script to ensure we only delete our own lock
   * @param lock - The lock to release
   * @returns true if released, false otherwise
   */
  async releaseLock(lock: Lock): Promise<boolean> {
    try {
      const result = await this.redisService.eval(
        this.RELEASE_LOCK_SCRIPT,
        [lock.key],
        [lock.value],
      );

      const released = result === 1;
      if (released) {
        this.logger.debug(`Lock released: ${lock.key}`);
      } else {
        this.logger.warn(
          `Lock release failed (expired or owned by another process): ${lock.key}`,
        );
      }

      return released;
    } catch (error) {
      this.logger.error(`Error releasing lock ${lock.key}:`, error);
      return false;
    }
  }

  /**
   * Acquire multiple locks atomically (all or nothing)
   * Locks are acquired in sorted order to prevent deadlocks
   * @param resources - Array of resources to lock
   * @param options - Lock options
   * @returns Array of locks if all acquired, null otherwise
   */
  async acquireMultipleLocks(
    resources: string[],
    options: LockOptions = {},
  ): Promise<Lock[] | null> {
    // Sort resources to prevent deadlock
    const sortedResources = [...resources].sort();
    const acquiredLocks: Lock[] = [];

    try {
      for (const resource of sortedResources) {
        const lock = await this.acquireLock(resource, options);

        if (!lock) {
          // Failed to acquire lock, release all previously acquired locks
          await this.releaseMultipleLocks(acquiredLocks);
          return null;
        }

        acquiredLocks.push(lock);
      }

      return acquiredLocks;
    } catch (error) {
      // Release any locks we acquired
      await this.releaseMultipleLocks(acquiredLocks);
      throw error;
    }
  }

  /**
   * Release multiple locks
   * @param locks - Array of locks to release
   */
  async releaseMultipleLocks(locks: Lock[]): Promise<void> {
    const releasePromises = locks.map((lock) => this.releaseLock(lock));
    await Promise.allSettled(releasePromises);
  }

  /**
   * Execute a function while holding a lock
   * Automatically acquires and releases the lock
   * @param resource - The resource to lock
   * @param fn - The function to execute
   * @param options - Lock options
   * @returns The result of the function
   */
  async withLock<T>(
    resource: string,
    fn: () => Promise<T>,
    options: LockOptions = {},
  ): Promise<T> {
    const lock = await this.acquireLock(resource, options);

    if (!lock) {
      throw new Error(`Failed to acquire lock for resource: ${resource}`);
    }

    try {
      return await fn();
    } finally {
      await this.releaseLock(lock);
    }
  }

  /**
   * Execute a function while holding multiple locks
   * Automatically acquires and releases locks in sorted order
   * @param resources - Array of resources to lock
   * @param fn - The function to execute
   * @param options - Lock options
   * @returns The result of the function
   */
  async withMultipleLocks<T>(
    resources: string[],
    fn: () => Promise<T>,
    options: LockOptions = {},
  ): Promise<T> {
    const locks = await this.acquireMultipleLocks(resources, options);

    if (!locks) {
      throw new Error(
        `Failed to acquire locks for resources: ${resources.join(', ')}`,
      );
    }

    try {
      return await fn();
    } finally {
      await this.releaseMultipleLocks(locks);
    }
  }

  /**
   * Extend lock TTL (use carefully - generally better to release and re-acquire)
   * @param lock - The lock to extend
   * @param additionalSeconds - Additional seconds to add to TTL
   * @returns true if extended, false otherwise
   */
  async extendLock(lock: Lock, additionalSeconds: number): Promise<boolean> {
    const client = this.redisService.getClient();
    const currentValue = await client.get(lock.key);

    if (currentValue === lock.value) {
      await this.redisService.expire(lock.key, additionalSeconds);
      return true;
    }

    return false;
  }

  /**
   * Check if a lock is currently held
   * @param resource - The resource to check
   * @returns true if locked, false otherwise
   */
  async isLocked(resource: string): Promise<boolean> {
    const lockKey = this.getLockKey(resource);
    return this.redisService.exists(lockKey);
  }

  /**
   * Get the lock key for a resource
   */
  private getLockKey(resource: string): string {
    return `lock:${resource}`;
  }

  /**
   * Sleep for a specified number of milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
