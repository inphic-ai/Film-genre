import { describe, it, expect } from "vitest";
import { getRedis, withCache, clearCache } from "./_core/redis";

describe("Redis Connection Tests", () => {
  it("should connect to Redis successfully", async () => {
    const redis = getRedis();
    
    // 如果 REDIS_URL 未設定，跳過測試
    if (!redis) {
      console.log("[Test] REDIS_URL not configured, skipping Redis tests");
      expect(redis).toBeNull();
      return;
    }
    
    // 測試 Redis 連線
    const pingResult = await redis.ping();
    expect(pingResult).toBe("PONG");
    
    console.log("[Test] ✅ Redis connection successful");
  });
  
  it("should set and get cache correctly", async () => {
    const redis = getRedis();
    if (!redis) {
      console.log("[Test] REDIS_URL not configured, skipping cache test");
      return;
    }
    
    // 測試快取寫入與讀取
    const testKey = "test:cache:key";
    const testValue = { message: "Hello Redis", timestamp: Date.now() };
    
    // 寫入快取
    await redis.set(testKey, JSON.stringify(testValue), "EX", 60);
    
    // 讀取快取
    const cachedValue = await redis.get(testKey);
    expect(cachedValue).not.toBeNull();
    
    const parsed = JSON.parse(cachedValue!);
    expect(parsed.message).toBe("Hello Redis");
    
    // 清除測試快取
    await redis.del(testKey);
    
    console.log("[Test] ✅ Cache set/get successful");
  });
  
  it("should use withCache helper correctly", async () => {
    const redis = getRedis();
    if (!redis) {
      console.log("[Test] REDIS_URL not configured, skipping withCache test");
      return;
    }
    
    const testKey = "test:with_cache:key";
    let fetcherCallCount = 0;
    
    const fetcher = async () => {
      fetcherCallCount++;
      return { data: "test data", count: fetcherCallCount };
    };
    
    // 第一次呼叫（快取未命中）
    const result1 = await withCache(testKey, 60, fetcher);
    expect(result1.data).toBe("test data");
    expect(fetcherCallCount).toBe(1);
    
    // 第二次呼叫（快取命中）
    const result2 = await withCache(testKey, 60, fetcher);
    expect(result2.data).toBe("test data");
    expect(fetcherCallCount).toBe(1); // fetcher 不應該被再次呼叫
    
    // 清除測試快取
    await clearCache(testKey);
    
    console.log("[Test] ✅ withCache helper works correctly");
  });
  
  it("should clear cache by pattern", async () => {
    const redis = getRedis();
    if (!redis) {
      console.log("[Test] REDIS_URL not configured, skipping clearCache test");
      return;
    }
    
    // 建立多個測試快取
    await redis.set("test:pattern:1", "value1", "EX", 60);
    await redis.set("test:pattern:2", "value2", "EX", 60);
    await redis.set("test:pattern:3", "value3", "EX", 60);
    
    // 清除所有符合模式的快取
    const clearedCount = await clearCache("test:pattern:*");
    expect(clearedCount).toBe(3);
    
    // 驗證快取已清除
    const value1 = await redis.get("test:pattern:1");
    expect(value1).toBeNull();
    
    console.log("[Test] ✅ clearCache works correctly");
  });
});
