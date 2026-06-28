import Redis from 'ioredis';
import { config } from '../../config';
import { logger } from '../logging/logger';

let redisClient: Redis | null = null;

export function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          logger.error('Redis connection failed after 3 retries');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected');
    });

    redisClient.on('error', (err) => {
      logger.error({ error: err.message }, 'Redis error');
    });
  }
  return redisClient;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedis();
    const value = await redis.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  } catch (err) {
    logger.warn({ error: (err as Error).message }, 'Cache get error');
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttl: number = 300): Promise<void> {
  try {
    const redis = getRedis();
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await redis.setex(key, ttl, serialized);
  } catch (err) {
    logger.warn({ error: (err as Error).message }, 'Cache set error');
  }
}

export async function cacheDelete(key: string): Promise<void> {
  try {
    const redis = getRedis();
    await redis.del(key);
  } catch (err) {
    logger.warn({ error: (err as Error).message }, 'Cache delete error');
  }
}

export async function cacheDeletePattern(pattern: string): Promise<void> {
  try {
    const redis = getRedis();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    logger.warn({ error: (err as Error).message }, 'Cache delete pattern error');
  }
}
