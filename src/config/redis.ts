import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

/**
 * Shared ioredis client. Used for caching, email/reset token storage (with TTL)
 * and refresh-token revocation. Lazily connects so the app can boot even if
 * Redis is briefly unavailable.
 */
export const redis = new Redis(env.redis.url, {
  lazyConnect: true,
  maxRetriesPerRequest: 2,
  retryStrategy: (times) => Math.min(times * 200, 2000),
});

redis.on('error', (err) => logger.error('Redis error:', err.message));
redis.on('connect', () => logger.info('Redis connection established'));

export async function connectRedis(): Promise<void> {
  if (redis.status === 'ready' || redis.status === 'connecting') return;
  await redis.connect();
}
