import { redis } from '../config/redis';
import { logger } from '../config/logger';

/**
 * Thin wrapper around Redis for JSON caching and TTL'd token storage.
 * All reads fail soft: if Redis is down we log and behave as a cache miss
 * rather than breaking the request.
 */
export const cache = {
  async getJson<T>(key: string): Promise<T | null> {
    try {
      const raw = await redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (err) {
      logger.warn('cache.getJson failed:', (err as Error).message);
      return null;
    }
  },

  async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      logger.warn('cache.setJson failed:', (err as Error).message);
    }
  },

  /** Store a raw string value with TTL (used for email/reset tokens). */
  async setEx(key: string, value: string, ttlSeconds: number): Promise<void> {
    await redis.set(key, value, 'EX', ttlSeconds);
  },

  async get(key: string): Promise<string | null> {
    return redis.get(key);
  },

  async del(...keys: string[]): Promise<void> {
    if (keys.length) await redis.del(...keys);
  },

  /** Delete every key matching a glob pattern (e.g. invalidate cached lists). */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length) await redis.del(...keys);
    } catch (err) {
      logger.warn('cache.delPattern failed:', (err as Error).message);
    }
  },
};

// Namespaced key builders keep cache keys consistent across the codebase.
export const cacheKeys = {
  userList: (page: number, limit: number, search: string) =>
    `users:list:${page}:${limit}:${search || '_'}`,
  userListPattern: 'users:list:*',
  user: (id: string) => `users:item:${id}`,
  emailVerify: (token: string) => `verify:${token}`,
  passwordReset: (token: string) => `reset:${token}`,
};
