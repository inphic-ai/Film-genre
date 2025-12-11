import Redis from 'ioredis';

let redis: Redis | null = null;

/**
 * 取得 Redis 客戶端實例
 * 如果 REDIS_URL 未設定，返回 null（開發環境可選）
 */
export function getRedis(): Redis | null {
  if (redis) return redis;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn('[Redis] REDIS_URL not configured, caching disabled');
    return null;
  }

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true; // Reconnect on READONLY error
        }
        return false;
      },
    });

    redis.on('connect', () => {
      console.log('[Redis] ✅ Connected successfully');
    });

    redis.on('error', (err) => {
      console.error('[Redis] ❌ Connection error:', err.message);
    });

    return redis;
  } catch (error) {
    console.error('[Redis] ❌ Failed to initialize:', error);
    return null;
  }
}

/**
 * 快取輔助函數
 * 自動處理快取讀取、寫入、過期
 * 
 * @param key - 快取鍵
 * @param ttl - 過期時間（秒）
 * @param fetcher - 資料獲取函數（當快取未命中時執行）
 * @returns 快取或新資料
 */
export async function withCache<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const redis = getRedis();

  // 如果 Redis 未啟用，直接執行 fetcher
  if (!redis) {
    return await fetcher();
  }

  try {
    // 嘗試從快取讀取
    const cached = await redis.get(key);
    if (cached) {
      console.log(`[Redis] ✅ Cache hit: ${key}`);
      return JSON.parse(cached) as T;
    }

    console.log(`[Redis] ⚠️ Cache miss: ${key}`);
  } catch (error) {
    console.error(`[Redis] ❌ Cache read error for ${key}:`, error);
  }

  // 快取未命中，執行 fetcher
  const data = await fetcher();

  // 嘗試寫入快取
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
    console.log(`[Redis] ✅ Cache set: ${key} (TTL: ${ttl}s)`);
  } catch (error) {
    console.error(`[Redis] ❌ Cache write error for ${key}:`, error);
  }

  return data;
}

/**
 * 清除快取
 * 
 * @param pattern - 快取鍵模式（支援萬用字元 *）
 * @returns 清除的快取數量
 */
export async function clearCache(pattern: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length === 0) return 0;

    await redis.del(...keys);
    console.log(`[Redis] ✅ Cleared ${keys.length} cache keys matching: ${pattern}`);
    return keys.length;
  } catch (error) {
    console.error(`[Redis] ❌ Cache clear error for ${pattern}:`, error);
    return 0;
  }
}

/**
 * 清除單一快取鍵
 * 
 * @param key - 快取鍵
 * @returns 是否成功清除
 */
export async function invalidateCache(key: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    const result = await redis.del(key);
    if (result > 0) {
      console.log(`[Redis] ✅ Invalidated cache: ${key}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`[Redis] ❌ Cache invalidation error for ${key}:`, error);
    return false;
  }
}

/**
 * 批次清除多個快取鍵
 * 
 * @param keys - 快取鍵陣列
 * @returns 清除的快取數量
 */
export async function invalidateCacheKeys(keys: string[]): Promise<number> {
  const redis = getRedis();
  if (!redis || keys.length === 0) return 0;

  try {
    const result = await redis.del(...keys);
    console.log(`[Redis] ✅ Invalidated ${result} cache keys`);
    return result;
  } catch (error) {
    console.error(`[Redis] ❌ Batch cache invalidation error:`, error);
    return 0;
  }
}

/**
 * 清除 Dashboard 相關快取
 * 用於新增/更新/刪除影片、商品、筆記時
 */
export async function invalidateDashboardCache(): Promise<void> {
  await clearCache('dashboard:*');
}

/**
 * 清除影片相關快取
 * 用於新增/更新/刪除影片時
 */
export async function invalidateVideoCache(): Promise<void> {
  await invalidateCacheKeys([
    'dashboard:video_stats:v1',
    'dashboard:overview:v1',
    'dashboard:recent_videos:v1',
  ]);
}

/**
 * 清除商品相關快取
 * 用於新增/更新/刪除商品時
 */
export async function invalidateProductCache(): Promise<void> {
  await invalidateCacheKeys([
    'dashboard:product_stats:v1',
    'dashboard:overview:v1',
  ]);
}

/**
 * 清除使用者活動相關快取
 * 用於審核筆記時
 */
export async function invalidateUserActivityCache(): Promise<void> {
  await invalidateCacheKeys([
    'dashboard:user_activity:v1',
    'dashboard:overview:v1',
  ]);
}
