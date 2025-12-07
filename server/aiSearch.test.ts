import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import type { Context } from './_core/context';

// Mock context for testing
const mockContext: Context = {
  req: {} as any,
  res: {} as any,
  user: {
    id: 1,
    openId: 'test-open-id',
    name: 'Test Admin',
    email: 'admin@test.com',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    loginMethod: 'oauth',
  },
};

describe('AI Smart Search', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    caller = appRouter.createCaller(mockContext);
  });

  describe('parseQuery', () => {
    it('應該解析評分查詢（「找評分 4 星以上的影片」）', async () => {
      const result = await caller.aiSearch.parseQuery({
        query: '找評分 4 星以上的影片',
      });

      console.log('✅ 解析結果:', result);

      expect(result).toBeDefined();
      expect(result.rating).toBeDefined();
      expect(result.rating?.min).toBeGreaterThanOrEqual(4);
    });

    it('應該解析分類查詢（「搜尋維修影片」）', async () => {
      const result = await caller.aiSearch.parseQuery({
        query: '搜尋維修影片',
      });

      console.log('✅ 解析結果:', result);

      expect(result).toBeDefined();
      expect(result.category).toBe('maintenance');
    });

    it('應該解析平台查詢（「找 YouTube 平台的影片」）', async () => {
      const result = await caller.aiSearch.parseQuery({
        query: '找 YouTube 平台的影片',
      });

      console.log('✅ 解析結果:', result);

      expect(result).toBeDefined();
      expect(result.platform).toBe('youtube');
    });

    it('應該解析抖音平台查詢（「找抖音的影片」）', async () => {
      const result = await caller.aiSearch.parseQuery({
        query: '找抖音的影片',
      });

      console.log('✅ 解析結果:', result);

      expect(result).toBeDefined();
      expect(result.platform).toBe('tiktok');
    });

    it('應該解析複合查詢（「找評分高且有維修標籤的 YouTube 影片」）', async () => {
      const result = await caller.aiSearch.parseQuery({
        query: '找評分高且有維修標籤的 YouTube 影片',
      });

      console.log('✅ 解析結果:', result);

      expect(result).toBeDefined();
      // 檢查是否包含評分、分類或標籤、平台等條件
      const hasRating = result.rating !== undefined;
      const hasCategory = result.category === 'maintenance';
      const hasPlatform = result.platform === 'youtube';
      
      expect(hasRating || hasCategory || hasPlatform).toBe(true);
    });

    it('應該解析排序查詢（「找最新上傳的影片」）', async () => {
      const result = await caller.aiSearch.parseQuery({
        query: '找最新上傳的影片',
      });

      console.log('✅ 解析結果:', result);

      expect(result).toBeDefined();
      expect(result.sortBy).toBe('createdAt');
      expect(result.sortOrder).toBe('desc');
    });
  });

  describe('search', () => {
    it('應該根據評分條件搜尋影片', async () => {
      const parsedQuery = {
        rating: { min: 3 },
      };

      const result = await caller.aiSearch.search({
        parsedQuery,
        limit: 10,
        offset: 0,
      });

      console.log('✅ 搜尋結果:', {
        total: result.total,
        count: result.videos.length,
        query: result.query,
      });

      expect(result).toBeDefined();
      expect(result.videos).toBeDefined();
      expect(Array.isArray(result.videos)).toBe(true);
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.query).toEqual(parsedQuery);

      // 驗證所有影片的評分都 >= 3
      result.videos.forEach(video => {
        if (video.rating !== null) {
          expect(video.rating).toBeGreaterThanOrEqual(3);
        }
      });
    });

    it('應該根據分類條件搜尋影片', async () => {
      const parsedQuery = {
        category: 'maintenance' as const,
      };

      const result = await caller.aiSearch.search({
        parsedQuery,
        limit: 10,
        offset: 0,
      });

      console.log('✅ 搜尋結果:', {
        total: result.total,
        count: result.videos.length,
        query: result.query,
      });

      expect(result).toBeDefined();
      expect(result.videos).toBeDefined();
      expect(Array.isArray(result.videos)).toBe(true);

      // 驗證所有影片的分類都是 maintenance
      result.videos.forEach(video => {
        expect(video.category).toBe('maintenance');
      });
    });

    it('應該根據平台條件搜尋影片', async () => {
      const parsedQuery = {
        platform: 'youtube' as const,
      };

      const result = await caller.aiSearch.search({
        parsedQuery,
        limit: 10,
        offset: 0,
      });

      console.log('✅ 搜尋結果:', {
        total: result.total,
        count: result.videos.length,
        query: result.query,
      });

      expect(result).toBeDefined();
      expect(result.videos).toBeDefined();
      expect(Array.isArray(result.videos)).toBe(true);

      // 驗證所有影片的平台都是 youtube
      result.videos.forEach(video => {
        expect(video.platform).toBe('youtube');
      });
    });

    it('應該支援分頁功能', async () => {
      const parsedQuery = {};

      // 第一頁
      const page1 = await caller.aiSearch.search({
        parsedQuery,
        limit: 5,
        offset: 0,
      });

      // 第二頁
      const page2 = await caller.aiSearch.search({
        parsedQuery,
        limit: 5,
        offset: 5,
      });

      console.log('✅ 分頁測試:', {
        page1Count: page1.videos.length,
        page2Count: page2.videos.length,
        total: page1.total,
      });

      expect(page1.videos).toBeDefined();
      expect(page2.videos).toBeDefined();

      // 如果總數 > 5，則第一頁和第二頁的影片應該不同
      if (page1.total > 5) {
        const page1Ids = page1.videos.map(v => v.id);
        const page2Ids = page2.videos.map(v => v.id);
        
        // 檢查是否有重複的影片 ID
        const hasOverlap = page1Ids.some(id => page2Ids.includes(id));
        expect(hasOverlap).toBe(false);
      }
    });

    it('應該支援排序功能（評分降序）', async () => {
      const parsedQuery = {
        sortBy: 'rating' as const,
        sortOrder: 'desc' as const,
      };

      const result = await caller.aiSearch.search({
        parsedQuery,
        limit: 10,
        offset: 0,
      });

      console.log('✅ 排序測試:', {
        count: result.videos.length,
        ratings: result.videos.map(v => v.rating),
      });

      expect(result.videos).toBeDefined();

      // 驗證評分是降序排列（忽略 null 值）
      const ratings = result.videos
        .map(v => v.rating)
        .filter((r): r is number => r !== null);

      for (let i = 0; i < ratings.length - 1; i++) {
        expect(ratings[i]).toBeGreaterThanOrEqual(ratings[i + 1]);
      }
    });

    it('應該支援複合條件搜尋（評分 + 分類 + 平台）', async () => {
      const parsedQuery = {
        rating: { min: 3 },
        category: 'maintenance' as const,
        platform: 'youtube' as const,
      };

      const result = await caller.aiSearch.search({
        parsedQuery,
        limit: 10,
        offset: 0,
      });

      console.log('✅ 複合條件搜尋結果:', {
        total: result.total,
        count: result.videos.length,
        query: result.query,
      });

      expect(result).toBeDefined();
      expect(result.videos).toBeDefined();

      // 驗證所有影片符合條件
      result.videos.forEach(video => {
        if (video.rating !== null) {
          expect(video.rating).toBeGreaterThanOrEqual(3);
        }
        expect(video.category).toBe('maintenance');
        expect(video.platform).toBe('youtube');
      });
    });
  });

  describe('整合測試', () => {
    it('應該完整執行：解析查詢 → 執行搜尋', async () => {
      // Step 1: 解析查詢
      const parsedQuery = await caller.aiSearch.parseQuery({
        query: '找評分 4 星以上的維修影片',
      });

      console.log('✅ Step 1 - 解析結果:', parsedQuery);

      expect(parsedQuery).toBeDefined();

      // Step 2: 執行搜尋
      const searchResult = await caller.aiSearch.search({
        parsedQuery,
        limit: 10,
        offset: 0,
      });

      console.log('✅ Step 2 - 搜尋結果:', {
        total: searchResult.total,
        count: searchResult.videos.length,
        query: searchResult.query,
      });

      expect(searchResult).toBeDefined();
      expect(searchResult.videos).toBeDefined();
      expect(searchResult.total).toBeGreaterThanOrEqual(0);
    });
  });
});
