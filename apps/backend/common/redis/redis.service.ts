import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT_LABELS } from './redis.constants.js';
import { createRedisConfigFromEnv } from './redis.config.js';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private subscriber: Redis;

  constructor() {
    const redisConfig = createRedisConfigFromEnv();

    this.client = new Redis(redisConfig);
    this.subscriber = new Redis(redisConfig);
  }

  async onModuleInit() {
    this.attachClientEventHandlers(this.client, REDIS_CLIENT_LABELS.client);
    this.attachClientEventHandlers(
      this.subscriber,
      REDIS_CLIENT_LABELS.subscriber,
    );

    // Test connection
    try {
      await this.client.ping();
      this.logger.log('Redis connection verified');
    } catch (error) {
      this.logger.error('Redis connection failed:', error);
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
    await this.subscriber.quit();
    this.logger.log('Redis connections closed');
  }

  /**
   * Get the main Redis client
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * Get the subscriber client (for pub/sub patterns)
   */
  getSubscriber(): Redis {
    return this.subscriber;
  }

  /**
   * Set a key with optional TTL
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<string> {
    if (ttlSeconds) {
      return this.client.set(key, value, 'EX', ttlSeconds);
    }
    return this.client.set(key, value);
  }

  /**
   * Get a value by key
   */
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  /**
   * Delete a key
   */
  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  /**
   * Set if not exists (returns true if set, false if key already exists)
   */
  async setnx(
    key: string,
    value: string,
    ttlSeconds?: number,
  ): Promise<boolean> {
    if (ttlSeconds) {
      const result = await this.client.set(key, value, 'EX', ttlSeconds, 'NX');
      return result === 'OK';
    }
    const result = await this.client.setnx(key, value);
    return result === 1;
  }

  /**
   * Execute a Lua script
   */
  async eval(
    script: string,
    keys: string[],
    args: (string | number)[],
  ): Promise<any> {
    return this.client.eval(script, keys.length, ...keys, ...args);
  }

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  /**
   * Decrement a counter
   */
  async decr(key: string): Promise<number> {
    return this.client.decr(key);
  }

  /**
   * Set expiry on a key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.client.expire(key, seconds);
    return result === 1;
  }

  /**
   * Get time to live for a key
   */
  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * Get all keys matching a pattern
   */
  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  /**
   * Delete multiple keys
   */
  async delMultiple(keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    return this.client.del(...keys);
  }

  private attachClientEventHandlers(client: Redis, label: string): void {
    client.on('connect', () => {
      this.logger.log(`Redis ${label} connected`);
    });

    client.on('error', (err) => {
      this.logger.error(`Redis ${label} error:`, err);
    });
  }
}
