import Redis from 'ioredis';

let redis: Redis | null = null;

export const getRedis = (): Redis => {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
      tls: process.env.REDIS_URL!.startsWith('rediss://') ? {} : undefined,
    });

    redis.on('connect', () => console.log('[Redis] Connected'));
    redis.on('error', (err) => console.error('[Redis] Error:', err));
    redis.on('close', () => console.warn('[Redis] Connection closed'));
  }
  return redis;
};

export const setCache = async (key: string, value: unknown, ttlSeconds?: number): Promise<void> => {
  const r = getRedis();
  const serialized = JSON.stringify(value);
  if (ttlSeconds) {
    await r.setex(key, ttlSeconds, serialized);
  } else {
    await r.set(key, serialized);
  }
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  const r = getRedis();
  const raw = await r.get(key);
  return raw ? (JSON.parse(raw) as T) : null;
};

export const deleteCache = async (key: string): Promise<void> => {
  await getRedis().del(key);
};

export const deleteCachePattern = async (pattern: string): Promise<void> => {
  const r = getRedis();
  const keys = await r.keys(pattern);
  if (keys.length > 0) await r.del(...keys);
};
